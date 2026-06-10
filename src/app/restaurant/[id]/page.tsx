'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Utensils, ArrowLeft, Calendar, User } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Review {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  overall: number;
  taste: number;
  service: number;
  ambiance: number;
  costBenefit?: number;
  cost_benefit?: number;
  ux?: number;
  spendPerPerson?: number;
  spend_per_person?: number;
  price: string;
  description: string;
  image: string;
  author: string;
  date: string;
}

const getStarClass = (rating: number) => {
  if (rating <= 2) return 'gradient-star-low';
  if (rating <= 4) return 'gradient-star-medium';
  return 'gradient-star-high';
};

export default function RestaurantPage() {
  const params = useParams();
  const id = params?.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadReview() {
      try {
        const response = await fetch('/api/reviews');
        const result = await response.json();
        
        let foundReview: Review | null = null;

        if (result.success) {
          foundReview = result.data.find((r: Review) => r.id === id) || null;
        }

        // If not found in database, check localStorage for sandbox mock reviews
        if (!foundReview) {
          const localMock = localStorage.getItem('mock_reviews');
          if (localMock) {
            const localArray = JSON.parse(localMock);
            foundReview = localArray.find((r: Review) => r.id === id) || null;
          }
        }

        setReview(foundReview);
      } catch (error) {
        console.error("Error loading restaurant details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReview();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--accent-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '2px solid rgba(229, 104, 59, 0.2)',
            borderTopColor: 'var(--accent-gold)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'var(--font-sans)',
      }}>
        <h2 className="serif-title" style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Restaurante Não Encontrado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>A avaliação selecionada não pôde ser encontrada.</p>
        <Link href="/home#reviews" className="btn-gold">Voltar para o Painel</Link>
      </div>
    );
  }

  const tasteVal = review.taste || 8;
  const serviceVal = review.service || 8;
  const ambianceVal = review.ambiance || 8;
  const costBenefitVal = review.costBenefit ?? review.cost_benefit ?? 8;
  const uxVal = review.ux ?? 8;
  const spendPerPersonVal = review.spendPerPerson ?? review.spend_per_person ?? 150;
  const avgScore = (tasteVal + serviceVal + ambianceVal + costBenefitVal + uxVal) / 5;
  const starsCount = Math.max(1, Math.min(5, Math.round(avgScore / 2)));

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      paddingTop: '120px', // spacing for fixed header
      paddingBottom: '80px',
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <Navbar isLoggedIn={true} onLoginToggle={() => {}} onOpenAddReview={() => {}} />
      </div>

      {/* Main Content Area */}
      <main className="container" style={{ maxWidth: '1100px' }}>
        
        {/* Back Link */}
        <Link 
          href="/home#reviews" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '32px',
            transition: 'color 0.2s',
          }}
        >
          <ArrowLeft size={16} />
          Voltar para o Painel
        </Link>

        {/* Dynamic Details Layout: Left Photo, Right Text */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.1fr) 1fr',
          gap: '50px',
          alignItems: 'start',
        }} className="restaurant-details-grid">
          
          {/* Left Side: Photo panel */}
          <div style={{
            position: 'sticky',
            top: '120px',
          }}>
            <div className="glass-panel-gold" style={{
              overflow: 'hidden',
              borderRadius: '24px',
              border: '1px solid var(--border-gold)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px var(--accent-gold-glow)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={review.image} 
                alt={review.name} 
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            
            {/* Visual Deco Line */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
              marginTop: '30px',
              opacity: 0.6,
            }} />
          </div>

          {/* Right Side: Description & Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Title Block */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  {review.cuisine}
                </span>
                <span style={{
                  backgroundColor: 'rgba(229, 104, 59, 0.08)',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--accent-gold)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}>
                  {review.price} • R$ {spendPerPersonVal} por pessoa
                </span>
              </div>

              <h1 className="serif-title gold-gradient-text" style={{
                fontSize: '3.2rem',
                lineHeight: 1.1,
                fontWeight: 500,
                marginBottom: '16px',
              }}>
                {review.name}
              </h1>

              {/* Location & Star Rating */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <MapPin size={18} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.95rem' }}>{review.location}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', color: 'var(--accent-gold)' }}>
                  {Array.from({ length: starsCount }).map((_, i) => (
                    <span key={i} className={getStarClass(starsCount)} style={{ fontSize: '1.4rem' }}>★</span>
                  ))}
                  {Array.from({ length: 5 - starsCount }).map((_, i) => (
                    <span key={i} style={{ fontSize: '1.4rem', color: 'rgba(255, 255, 255, 0.15)' }}>★</span>
                  ))}
                  <span style={{ marginLeft: '6px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                    ({avgScore.toFixed(1)}/10 Média)
                  </span>
                </div>
              </div>
            </div>

            {/* Score Breakdown Panel */}
            <div className="glass-panel" style={{
              padding: '28px',
              border: '1px solid rgba(205, 164, 94, 0.2)',
              backgroundColor: 'rgba(205, 164, 94, 0.02)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <h3 style={{
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                marginBottom: '8px',
              }}>
                Notas Detalhadas do Crítico (Média: {avgScore.toFixed(1)}/10)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Sabor', value: tasteVal },
                  { label: 'Serviço', value: serviceVal },
                  { label: 'Ambiente', value: ambianceVal },
                  { label: 'Custo-Benefício', value: costBenefitVal },
                  { label: 'Experiência (UX)', value: uxVal },
                ].map((item, index) => (
                  <div key={index} style={{
                    padding: '16px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                    <div>
                      <strong style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)' }}>{item.value}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critique Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent-gold)',
                fontWeight: 700,
              }}>
                A Culinária e a Experiência
              </h3>
              
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                textIndent: '20px',
                borderLeft: '2px solid var(--accent-gold)',
                paddingLeft: '20px',
              }}>
                "{review.description}"
              </p>
            </div>

            {/* Author Signature & Date */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed var(--border-light)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="var(--accent-gold)" />
                <span>Avaliado por: <strong style={{ color: '#fff' }}>{review.author}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--accent-gold)" />
                <span>{review.date}</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
