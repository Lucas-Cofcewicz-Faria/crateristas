'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const GourmetScene = dynamic(() => import('@/components/GourmetScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--accent-gold)',
      fontSize: '0.9rem',
    }}>
      Carregando Portal 3D...
    </div>
  )
});

export default function LandingPage() {
  const router = useRouter();
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scrollHintTimer: NodeJS.Timeout;

    const startScrollHintTimer = () => {
      scrollHintTimer = setTimeout(() => {
        if (window.scrollY < 10 && scrollHintRef.current) {
          scrollHintRef.current.style.opacity = '1';
          scrollHintRef.current.style.transform = 'translateX(-50%) translateY(0)';
        }
      }, 3000);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const triggerHeight = viewportHeight * 1.4; // Matches the 1.4x factor in GourmetScene
      const progress = Math.min(scrollY / triggerHeight, 1);

      // Hide scroll hint immediately on scroll
      if (scrollY > 10 && scrollHintRef.current) {
        scrollHintRef.current.style.opacity = '0';
        scrollHintRef.current.style.pointerEvents = 'none';
        clearTimeout(scrollHintTimer);
      }

      // Redirect to reviews dashboard when descent completes (95% of the crater descent)
      if (progress >= 0.95) {
        router.push('/home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    startScrollHintTimer();

    // Reset scroll to top on load/refresh so user starts descent from top
    window.scrollTo(0, 0);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollHintTimer);
    };
  }, [router]);

  return (
    <div style={{ minHeight: '240vh', backgroundColor: '#130917', position: 'relative' }}>
      {/* 3D Canvas Background Container */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 40,
          backgroundColor: '#130917',
        }}
      >
        <GourmetScene />
      </div>

      {/* Idle Scroll Hint */}
      <div
        ref={scrollHintRef}
        style={{
          position: 'fixed',
          bottom: '5vh',
          left: '50%',
          transform: 'translateX(-50%) translateY(20px)',
          zIndex: 70,
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--accent-gold)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <span className="animate-float" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          Role para baixo para descer na cratera
          <ChevronDown size={18} />
        </span>
      </div>

      {/* Crater Spacer - Creates scrollable area to drive the 3D depth camera */}
      <div style={{ height: '240vh', width: '100%', pointerEvents: 'none' }} />
    </div>
  );
}
