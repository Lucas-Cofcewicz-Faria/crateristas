export function getTrustedMemberAvatarUrl(candidate: string | null): string | null {
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const hasTrustedHost = url.hostname.endsWith('.public.blob.vercel-storage.com');
    const isMemberPath = url.pathname.startsWith('/members/')
      && url.pathname.length > '/members/'.length;

    if (
      url.protocol !== 'https:'
      || url.port !== ''
      || url.username !== ''
      || url.password !== ''
      || !hasTrustedHost
      || !isMemberPath
      || url.search !== ''
      || url.hash !== ''
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}
