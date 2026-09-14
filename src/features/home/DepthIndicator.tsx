'use client';

import { useEffect, useState } from 'react';
import styles from './home.module.css';

export interface DepthSection {
  id: string;
  label: string;
}

export function DepthIndicator({ sections }: { sections: readonly DepthSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActiveId(visible.target.id);
    }, { rootMargin: '-20% 0px -45%', threshold: 0.1 });

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Profundidade da página" className={styles.depthIndicator}>
      {sections.map((section, index) => (
        <a
          aria-current={activeId === section.id ? 'location' : undefined}
          href={`#${section.id}`}
          key={section.id}
        >
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          {section.label}
        </a>
      ))}
    </nav>
  );
}
