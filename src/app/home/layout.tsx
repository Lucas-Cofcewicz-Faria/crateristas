import type { ReactNode } from 'react';
import './legacy-home.css';

export default function LegacyHomeLayout({ children }: { children: ReactNode }) {
  return <div className="legacy-home">{children}</div>;
}
