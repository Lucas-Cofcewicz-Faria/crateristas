'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { publishMenuItemAction } from './menu-actions';

export function MenuPublicationControls({ restaurantSlug, itemSlug, published }: { restaurantSlug: string; itemSlug: string; published: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await publishMenuItemAction(data);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError('A conexão falhou. Tente novamente.');
    } finally { setPending(false); }
  }
  return <form onSubmit={submit}>
    <input type="hidden" name="restaurantSlug" value={restaurantSlug} />
    <input type="hidden" name="itemSlug" value={itemSlug} />
    <input type="hidden" name="command" value={published ? 'hide' : 'publish'} />
    <Button type="submit" disabled={pending} variant={published ? 'secondary' : 'primary'}>
      {pending ? 'Salvando…' : published ? 'Ocultar prato do público' : 'Publicar avaliação do prato'}
    </Button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
