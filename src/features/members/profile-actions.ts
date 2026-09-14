'use server';

import { randomUUID } from 'node:crypto';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, requireMember } from '@/lib/auth/access';
import { updateMemberTitle, updateOwnProfile } from './profile-repository';
import { getTrustedMemberAvatarUrl } from './member-avatar';

const bioSchema = z.string().trim().max(280);
const titleSchema = z.object({ memberId: z.uuid(), societyTitle: z.string().trim().max(60) });

function refreshProfiles() {
  for (const path of ['/perfil', '/painel', '/historia', '/home']) revalidatePath(path);
  revalidatePath('/membros/[slug]', 'page');
}

async function discardOwnedPhoto(url: string | null, memberId: string) {
  const trusted = getTrustedMemberAvatarUrl(url);
  if (!trusted || !new URL(trusted).pathname.startsWith(`/members/${memberId}/`)) return;
  try { await del(trusted); } catch { /* A failed cleanup must not undo the saved profile. */ }
}

export async function saveProfileAction(data: FormData): Promise<{ error: string | null; avatarUrl?: string | null }> {
  let saved;
  try {
    const member = await requireMember();
    const bio = bioSchema.safeParse(data.get('bio'));
    if (!bio.success) return { error: 'Use até 280 caracteres na descrição.' };
    const photo = data.get('photo');
    const hasPhoto = photo instanceof File && photo.size > 0;
    const removePhoto = data.get('removePhoto') === 'true';
    if (hasPhoto && removePhoto) return { error: 'Escolha entre trocar ou remover a foto.' };
    let avatarUrl: string | null = null;
    if (hasPhoto) {
      if (photo.type !== 'image/webp' || photo.size > 750_000) {
        return { error: 'Selecione novamente a foto para comprimi-la em WebP, com até 750 KB.' };
      }
      let bytes: Buffer;
      try {
        // Decode and re-encode: reject disguised files and strip metadata before publishing.
        const source = Buffer.from(await photo.arrayBuffer());
        const metadata = await sharp(source, { limitInputPixels: 16_000_000 }).metadata();
        if (metadata.format !== 'webp') throw new Error('Invalid image');
        bytes = await sharp(source, { limitInputPixels: 16_000_000 }).rotate()
          .resize(960, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        if (bytes.length > 750_000) throw new Error('Image too large');
      } catch {
        return { error: 'Não foi possível ler a foto. Escolha outra imagem JPEG, PNG ou WebP.' };
      }
      const uploaded = await put(`members/${member.id}/${randomUUID()}.webp`, bytes, {
        access: 'public', contentType: 'image/webp', addRandomSuffix: false,
      });
      avatarUrl = uploaded.url;
    }
    // Ignore any submitted memberId, societyTitle, role or avatar URL.
    saved = await updateOwnProfile(member.id, bio.data, hasPhoto || removePhoto, avatarUrl);
    if (!saved) {
      await discardOwnedPhoto(avatarUrl, member.id);
      return { error: 'Seu acesso mudou. Entre novamente antes de salvar o perfil.' };
    }
    if ((hasPhoto || removePhoto) && saved.oldAvatarUrl !== saved.avatarUrl) {
      await discardOwnedPhoto(saved.oldAvatarUrl, member.id);
    }
  } catch {
    // A database timeout can follow a commit: do not delete the newly uploaded image here.
    return { error: 'Não foi possível salvar o perfil. Verifique sua sessão e tente novamente.' };
  }
  refreshProfiles();
  return { error: null, avatarUrl: saved.avatarUrl };
}

export async function setMemberTitleAction(data: FormData): Promise<{ error: string | null }> {
  try {
    const admin = await requireAdmin();
    const parsed = titleSchema.safeParse({ memberId: data.get('memberId'), societyTitle: data.get('societyTitle') });
    if (!parsed.success) return { error: 'Escolha um integrante e use até 60 caracteres no cargo.' };
    if (!await updateMemberTitle(admin.id, parsed.data.memberId, parsed.data.societyTitle || null)) {
      return { error: 'Integrante indisponível ou acesso administrativo alterado. Atualize o painel.' };
    }
  } catch {
    return { error: 'Não foi possível alterar o cargo. Verifique seu acesso de administrador e tente novamente.' };
  }
  refreshProfiles();
  return { error: null };
}
