import React from 'react';
export function Link({ href, children, ...props }) { return <a href={href} {...props}>{children}</a>; }
export default function Image({ src, fill, priority, unoptimized, quality, placeholder, ...props }) {
  return <img src={src} {...props} style={{ ...props.style, ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : {}) }} />;
}
export const useRouter = () => ({ push: (href) => { window.__savedHref = href; }, refresh: () => {} });
export const usePathname = () => '/restaurantes/qa/menu';
export async function saveMenuReviewAction(data) { window.__lastMenuForm = Object.fromEntries(data); return { error: null, itemId: 'dish', href: '/restaurantes/qa/menu/prato-qa' }; }
export async function publishMenuItemAction() { return { error: null }; }
