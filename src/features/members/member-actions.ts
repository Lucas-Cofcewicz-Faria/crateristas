'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/access';
import { removeMember } from './member-administration';
import { MEMBER_REMOVAL_CONFIRMATION } from './member-management-state';

const schema = z.object({
  memberId: z.uuid(),
  confirmation: z.literal(MEMBER_REMOVAL_CONFIRMATION),
});

export async function removeMemberAction(data: FormData): Promise<{ error: string | null }> {
  try {
    const actor = await requireAdmin();
    const parsed = schema.safeParse({ memberId: data.get('memberId'), confirmation: data.get('confirmation') });
    if (!parsed.success) return { error: 'Selecione o integrante e digite “Remover integrante” exatamente como indicado.' };
    if (parsed.data.memberId === actor.id) return { error: 'Sua conta de administrador está protegida contra remoção.' };
    if (!await removeMember(actor.id, parsed.data.memberId)) {
      return { error: 'Integrante indisponível para remoção: a conta é protegida ou já foi removida. Atualize o painel.' };
    }
  } catch {
    return { error: 'Não foi possível remover o integrante. Verifique seu acesso de administrador e tente novamente.' };
  }
  revalidatePath('/painel');
  revalidatePath('/home');
  revalidatePath('/historia');
  return { error: null };
}
