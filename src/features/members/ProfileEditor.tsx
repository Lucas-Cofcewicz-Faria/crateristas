'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FilePicker } from '@/components/ui/FilePicker';
import { compressVisitImage } from '@/features/visits/compress-image';
import { MemberPortrait } from './MemberPortrait';
import { saveProfileAction } from './profile-actions';
import styles from './profile.module.css';

export interface EditableProfile {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  bio: string;
  societyTitle: string | null;
}

export function ProfileEditor({ member }: { member: EditableProfile }) {
  const router = useRouter();
  const [bio, setBio] = useState(member.bio);
  const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  function clearSelection() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPhoto(null); setPreview(null);
    if (input.current) input.current.value = '';
  }

  return <form className={styles.editor} aria-label="Editar meu perfil" aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set('bio', bio);
        data.set('removePhoto', String(removePhoto));
        if (photo) data.set('photo', await compressVisitImage(photo));
        const result = await saveProfileAction(data);
        if (result.error) { setFeedback({ error: true, text: result.error }); return; }
        setAvatarUrl(result.avatarUrl ?? null);
        setRemovePhoto(false); clearSelection();
        setFeedback({ error: false, text: 'Perfil atualizado. Sua história já está pública.' });
        router.refresh();
      } catch {
        setFeedback({ error: true, text: 'Não foi possível salvar. Confira a conexão e escolha uma imagem JPEG, PNG ou WebP para tentar novamente.' });
      }
    });
  }}>
    <div className={styles.photoColumn}>
      <div className={styles.portrait}>
        {preview ? (
          // A temporary local Blob URL is not a remote image for Next's optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.localPreview} src={preview} alt="Prévia da nova foto de perfil" />
        ) : <MemberPortrait avatarUrl={removePhoto ? null : avatarUrl} displayName={member.displayName} />}
      </div>
      <FilePicker ref={input} id="profile-photo" label="Escolher foto" accept="image/jpeg,image/png,image/webp" disabled={pending}
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
          previewUrl.current = selected ? URL.createObjectURL(selected) : null;
          setPhoto(selected); setPreview(previewUrl.current); setRemovePhoto(false); setFeedback(null);
        }} />
      <p className={styles.hint}>JPEG, PNG ou WebP. Comprimimos a foto antes de publicar.</p>
      {photo ? <><p className={styles.fileName}>{photo.name}</p><Button variant="secondary" disabled={pending} onClick={clearSelection}>Cancelar troca</Button></> : null}
      {!photo && avatarUrl ? <Button variant="secondary" disabled={pending} onClick={() => setRemovePhoto(!removePhoto)}>
        {removePhoto ? 'Manter foto atual' : 'Remover foto'}
      </Button> : null}
      {removePhoto ? <p className={styles.hint}>A foto será removida ao salvar.</p> : null}
    </div>
    <div className={styles.fields}>
      <h2>{member.displayName}</h2>
      <div className={styles.titleBlock}><span>Cargo oficial</span><strong>{member.societyTitle || 'Ainda não atribuído'}</strong>
        <p>Definido pelo administrador da sociedade.</p></div>
      <div className={styles.bioField}>
        <label htmlFor="profile-bio">Descrição opcional</label>
        <p id="profile-bio-help" className={styles.hint}>Um pouco de você, do seu gosto ou da sua relação com a cratera.</p>
        <textarea id="profile-bio" name="bio" rows={5} maxLength={280} value={bio} disabled={pending}
          aria-describedby="profile-bio-help profile-bio-count" onChange={(event) => setBio(event.target.value)} />
        <span id="profile-bio-count" className={styles.counter}>{bio.length}/280</span>
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>{pending ? 'Salvando perfil...' : 'Salvar perfil'}</Button>
        <Link className={styles.textLink} href={`/membros/${member.slug}`}>Ver perfil público <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
      {feedback ? <p className={styles.feedback} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p> : null}
    </div>
  </form>;
}
