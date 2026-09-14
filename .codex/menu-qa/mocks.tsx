import React from 'react';
export function Link({ href, children, ...props }) { return <a href={href} {...props}>{children}</a>; }
export default function Image({ src, fill, priority, unoptimized, quality, placeholder, ...props }) {
  if (src === 'https://demo.public.blob.vercel-storage.com/members/qa-portrait.jpeg') src = '/images/history/cratera1.jpeg';
  return <img src={src} {...props} style={{ ...props.style, ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : {}) }} />;
}
export const useRouter = () => ({ push: (href) => { window.__savedHref = href; }, refresh: () => {} });
export const usePathname = () => '/restaurantes/qa/menu';
export async function saveMenuReviewAction(data) { window.__lastMenuForm = Object.fromEntries(data); return { error: null, itemId: 'dish', href: '/restaurantes/qa/menu/prato-qa' }; }
export async function publishMenuItemAction() { return { error: null }; }
export async function saveProfileAction(data) { window.__profileData = Object.fromEntries(data); return { error: null, avatarUrl: null }; }
export async function setMemberTitleAction(data) { window.__titleData = Object.fromEntries(data); return { error: null }; }
export async function removeMemberAction() { return { error: null }; }
export async function logoutAction() { window.__signedOut = true; }
