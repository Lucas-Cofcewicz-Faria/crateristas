'use client';

import Link from 'next/link';
import { Utensils, LogOut, User } from 'lucide-react';

interface NavbarProps {
  isLoggedIn: boolean;
  onLoginToggle: () => void;
  onOpenAddReview: () => void;
  position?: 'fixed' | 'absolute' | 'relative';
}

export default function Navbar({ isLoggedIn, onLoginToggle, onOpenAddReview, position = 'fixed' }: NavbarProps) {
  return (
    <header className="glass-panel" style={{
      position,
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '1200px',
      zIndex: 100, // Reduced from 1000 so the landing overlay can display over it when at scroll position 0
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      {/* Logo */}
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          background: 'var(--accent-gold-glow)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Utensils size={18} color="var(--accent-gold)" />
        </div>
        <span className="serif-title gold-gradient-text" style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          CRATERISTAS
        </span>
      </Link>
      {/* Nav Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/home#hero" style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          transition: 'color 0.2s',
        }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
           onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Início
        </Link>
        <Link href="/home#reviews" style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          transition: 'color 0.2s',
        }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
           onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          Avaliações
        </Link>
        {isLoggedIn && (
          <Link 
            href="/add-restaurant"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--accent-gold)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Registrar Restaurante
          </Link>
        )}
      </nav>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--accent-gold)',
          background: 'rgba(205, 164, 94, 0.08)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid var(--accent-gold)',
          fontWeight: '700',
        }}>
          <User size={14} color="var(--accent-gold)" />
          <span>Painel Admin</span>
        </div>
      </div>
    </header>
  );
}
