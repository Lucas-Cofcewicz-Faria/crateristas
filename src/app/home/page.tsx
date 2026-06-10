'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Award, Compass, Code, Shield, Database, ArrowUp, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
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

const DISCIPLES = [
  { name: 'Thiago', role: 'Mestre da Brasa', img: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80' },
  { name: 'Bruno', role: 'Curador de Fogo & Defumação', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80' },
  { name: 'Luciana', role: 'Pâtissière Sensorial', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { name: 'Felipe', role: 'Mestre Massas & Pastas', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' },
  { name: 'Mariana', role: 'Mixologista & Drinks', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { name: 'Rodrigo', role: 'Sommelier de Cafés', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { name: 'André', role: 'Crítico de Terroir Senior', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
];

const WEEKLY_MENU = [
  { dayIndex: 1, dayName: 'Segunda-feira', dish: 'Frango Assado na Brasa', desc: 'Frango caipira marinado por 24 horas em ervas da cratera, assado lentamente na brasa com crosta crocante e suculência perfeita.', img: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=800&auto=format&fit=crop&q=80' },
  { dayIndex: 2, dayName: 'Terça-feira', dish: 'Frango à Parmegiana Clássico', desc: 'Filé de peito empanado na farinha panko artesanal, coberto com molho de tomate pelati e mussarela gratinada na lenha.', img: 'https://images.unsplash.com/photo-1626861300079-78a4427ad763?w=800&auto=format&fit=crop&q=80' },
  { dayIndex: 3, dayName: 'Quarta-feira', dish: 'Bisteca na Chapa de Ferro', desc: 'Corte nobre de bisteca de porco duroc, grelhada na chapa de ferro fundido com manteiga de garrafa e alho confitado.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80' },
  { dayIndex: 4, dayName: 'Quinta-feira', dish: 'Macarrão com Frango Desfiado', desc: 'Massa artesanal tagliolini fresca, envolvida em ragu cremoso de frango defumado e queijo parmesão da serra.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80' },
  { dayIndex: 5, dayName: 'Sexta-feira', dish: 'Peixe Frito com Molho Tártaro', desc: 'Filé de peixe do dia empanado em tempura leve de cerveja artesanal, servido dourado com molho tártaro caseiro.', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80' },
  { dayIndex: 0, dayName: 'Fim de Semana', dish: 'A cratera está fechada', desc: 'Nossa cozinha está fechada para descanso dos discípulos. Voltaremos na segunda-feira com novos pratos frescos.', img: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&auto=format&fit=crop&q=80', isClosed: true },
];

const getStarClass = (rating: number) => {
  if (rating <= 2) return 'gradient-star-low';
  if (rating <= 4) return 'gradient-star-medium';
  return 'gradient-star-high';
};

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Permanent Admin bypass
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbFallback, setDbFallback] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpPopup, setShowUpPopup] = useState(false);
  const [activeMenuIdx, setActiveMenuIdx] = useState(3); // Default to Thursday (index 3)

  // Determine current day of week to set active menu slide
  useEffect(() => {
    const today = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (today === 0 || today === 6) {
      setActiveMenuIdx(5); // Fim de Semana (weekend)
    } else {
      setActiveMenuIdx(today - 1); // 0 = Mon, 1 = Tue, ..., 4 = Fri
    }
  }, []);

  // Fetch reviews from database API on mount
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch('/api/reviews');
        const result = await response.json();
        if (result.success) {
          if (result.fallback) {
            const localMock = localStorage.getItem('mock_reviews');
            const localArray = localMock ? JSON.parse(localMock) : [];
            setReviews([...localArray, ...result.data]);
          } else {
            setReviews(result.data);
          }
          setDbFallback(!!result.fallback);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // Listen to wheel, touch, key, and scroll to show the redirection popup when scrolling up at the top
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (window.scrollY <= 5 && e.deltaY < 0) {
        setShowUpPopup(true);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY; // positive deltaY = swiping down (scroll up)
      if (window.scrollY <= 5 && deltaY > 0) {
        setShowUpPopup(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = ['ArrowUp', 'PageUp', 'Home'];
      if (window.scrollY <= 5 && blockedKeys.includes(e.key)) {
        setShowUpPopup(true);
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowUpPopup(false);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClimbUpRedirect = () => {
    setShowUpPopup(false);
    router.push('/');
  };

  const handleLoginToggle = () => {
    // Bypassed: user is permanently Admin
  };

  // Cuisine filter logic
  const cuisinesList = ['Todas', ...Array.from(new Set(reviews.map(r => r.cuisine)))];

  const filteredReviews = reviews.filter(review => {
    const matchesCuisine = selectedCuisine === 'Todas' || review.cuisine === selectedCuisine;
    const matchesSearch = review.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          review.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          review.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCuisine && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Navigation (Always visible and fixed on the dashboard page) */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <Navbar 
          isLoggedIn={isLoggedIn} 
          onLoginToggle={handleLoginToggle} 
          onOpenAddReview={() => router.push('/add-restaurant')} 
        />
      </div>

      {/* Main Website Content */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', zIndex: 50 }}>

        {/* 1. Content Hero Section */}
        <section id="hero" style={{
          paddingTop: '180px',
          paddingBottom: '80px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '60px',
              alignItems: 'center',
            }}>
              {/* Hero Left Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} color="var(--accent-gold)" />
                  <span style={{
                    color: 'var(--accent-gold)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}>
                    Comunidade Exclusiva
                  </span>
                </div>
                
                <h1 className="serif-title" style={{
                  fontSize: '3.6rem',
                  lineHeight: 1.1,
                  fontWeight: 400,
                }}>
                  Um Santuário para <br />
                  <span className="gold-gradient-text" style={{ fontWeight: 600 }}>Gastronomia Excepcional</span>
                </h1>

                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  maxWidth: '540px',
                }}>
                  Bem-vindo ao Crateristas. Um refúgio intimista planejado para amigos documentarem obras-primas culinárias, avaliarem experiências sensoriais minuciosas e catalogarem lendas da gastronomia paulistana.
                </p>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <a href="#reviews" className="btn-gold">
                    Explorar Avaliações
                  </a>
                  <Link href="/add-restaurant" className="btn-outline" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
                    Registrar Restaurante
                  </Link>
                </div>
              </div>

              {/* Hero Right Decorative Panel */}
              <div style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid var(--border-gold)',
                height: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, rgba(205,164,94,0.08) 0%, rgba(7,7,7,0.7) 100%)',
              }}>
                <div style={{ textAlign: 'center', padding: '30px', maxWidth: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <Award size={48} color="var(--accent-gold)" />
                  </div>
                  <h3 className="serif-title" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                    Curadoria Refinada
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Subimos os degraus da cratera apenas para trazer de volta relatos dos melhores cardápios de São Paulo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Os Discípulos do Guizão */}
        <section style={{
          padding: '100px 0',
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Award size={16} color="var(--accent-gold)" />
                <span style={{
                  color: 'var(--accent-gold)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}>
                  Irmandade Crítica
                </span>
              </div>
              <h2 className="serif-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
                Os Discípulos do Guizão
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
                Os sete guardiões da gastronomia da cratera. Um time dedicado a percorrer e documentar os relatos dos paladares mais refinados do mundo.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '30px',
              justifyContent: 'center',
            }}>
              {DISCIPLES.map((disciple, index) => (
                <div 
                  key={disciple.name}
                  className="glass-panel"
                  style={{
                    padding: '30px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--border-light)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    e.currentTarget.style.boxShadow = '0 10px 25px var(--accent-gold-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--accent-gold)',
                    boxShadow: '0 0 15px var(--accent-gold-glow)',
                    background: '#130917',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={disciple.img} 
                      alt={disciple.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h4 className="serif-title" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '4px' }}>
                      {disciple.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {disciple.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. O que a Cratera está Servindo Hoje (Weekly Menu Slider) */}
        <section style={{
          padding: '100px 0',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{
                  color: 'var(--accent-gold)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}>
                  Menu do Dia
                </span>
              </div>
              <h2 className="serif-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
                O que a Cratera está Servindo Hoje?
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
                Nossa cozinha opera com especialidades diárias exclusivas. Selecione os dias abaixo para conhecer o menu completo de nossos discípulos.
              </p>
            </div>

            {/* Day Selector Navigation Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '40px',
              maxWidth: '850px',
              margin: '0 auto 40px auto',
            }}>
              {WEEKLY_MENU.map((item, idx) => {
                const today = new Date().getDay();
                const isItToday = (item.dayIndex === today) || (item.dayIndex === 0 && (today === 0 || today === 6));
                const isActive = activeMenuIdx === idx;
                
                return (
                  <button
                    key={item.dayName}
                    onClick={() => setActiveMenuIdx(idx)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '30px',
                      border: '1px solid',
                      borderColor: isActive 
                        ? 'var(--accent-gold)' 
                        : isItToday 
                          ? 'rgba(205,164,94,0.3)' 
                          : 'var(--border-light)',
                      background: isActive 
                        ? 'var(--accent-gold)' 
                        : isItToday 
                          ? 'rgba(205,164,94,0.06)' 
                          : 'rgba(255,255,255,0.02)',
                      color: isActive ? '#070707' : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--accent-gold)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = isItToday ? 'rgba(205,164,94,0.3)' : 'var(--border-light)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <span>{item.dayName}</span>
                    {isItToday && (
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: isActive ? '#070707' : 'var(--accent-gold)',
                        color: isActive ? 'var(--accent-gold)' : '#070707',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}>
                        Hoje
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Dish Detail Slide */}
            <div className="glass-panel" style={{
              maxWidth: '850px',
              margin: '0 auto',
              padding: '40px',
              border: '1px solid var(--border-gold)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Prev/Next Navigation Controls */}
              <button 
                onClick={() => setActiveMenuIdx(prev => prev === 0 ? 5 : prev - 1)}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(7,7,7,0.6)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setActiveMenuIdx(prev => prev === 5 ? 0 : prev + 1)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(7,7,7,0.6)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <ChevronRight size={20} />
              </button>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 1.1fr) 1.2fr',
                gap: '40px',
                alignItems: 'center',
              }} className="form-row">
                {/* Left Side: Dish Photo */}
                <div style={{
                  height: '320px',
                  width: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)',
                  position: 'relative',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={WEEKLY_MENU[activeMenuIdx]?.img} 
                    alt={WEEKLY_MENU[activeMenuIdx]?.dish} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: WEEKLY_MENU[activeMenuIdx]?.isClosed ? 'grayscale(0.6) brightness(0.4)' : 'none',
                    }}
                  />
                  {WEEKLY_MENU[activeMenuIdx]?.isClosed && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(7,7,7,0.3)',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: 'var(--accent-gold)',
                        border: '2px solid var(--accent-gold)',
                        padding: '10px 20px',
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        background: 'rgba(19, 9, 23, 0.85)',
                      }}>
                        Fechado
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side: Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--accent-gold)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                    }}>
                      {WEEKLY_MENU[activeMenuIdx]?.dayName}
                    </span>
                    <h3 className="serif-title" style={{
                      fontSize: '2rem',
                      color: '#ffffff',
                      lineHeight: 1.2,
                    }}>
                      {WEEKLY_MENU[activeMenuIdx]?.dish}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}>
                    {WEEKLY_MENU[activeMenuIdx]?.desc}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px' }}>
                    {WEEKLY_MENU[activeMenuIdx]?.isClosed ? (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                      }}>
                        Cozinha fechada para descanso aos sábados e domingos.
                      </span>
                    ) : (
                      <span style={{
                        color: 'var(--accent-gold)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        background: 'var(--accent-gold-glow)',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: '1px solid var(--accent-gold)',
                      }}>
                        Servido das 11:30 às 14:30
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Reviews List Section */}
        <section id="reviews" style={{ padding: '100px 0', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="container">
            
            {/* Section Header */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '60px',
            }}>
              <h2 className="serif-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
                Obras-Primas Catalogadas
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.6' }}>
                Cada relato representa uma experiência imersiva completa. Filtre por tipo de cozinha ou busque por palavras-chave.
              </p>

              {dbFallback && (
                <div style={{
                  background: 'rgba(255, 200, 50, 0.05)',
                  border: '1px solid rgba(255, 200, 50, 0.3)',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  marginTop: '24px',
                  maxWidth: '850px',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#fff',
                }}>
                  <AlertTriangle size={24} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Modo de Demonstração (Sem Banco de Dados)</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      O site está rodando com dados locais temporários. Para salvar as avaliações no seu banco de dados <strong>Neon Postgres</strong>, configure a chave <code>DATABASE_URL</code> no arquivo <code>.env.local</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Filter & Search Bar */}
              <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '850px',
                padding: '16px 24px',
                marginTop: '40px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap',
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                  <Search size={18} color="var(--text-muted)" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Buscar por restaurante, culinária ou cidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '44px' }}
                  />
                </div>

                {/* Cuisine Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {cuisinesList.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCuisine(c)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: selectedCuisine === c ? 'var(--accent-gold)' : 'var(--border-light)',
                        background: selectedCuisine === c ? 'var(--accent-gold)' : 'rgba(255,255,255,0.02)',
                        color: selectedCuisine === c ? '#070707' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCuisine !== c) {
                          e.currentTarget.style.borderColor = 'var(--accent-gold)';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCuisine !== c) {
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      {c === 'All' ? 'Todas' : c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Grid */}
            {isLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '80px 0',
                color: 'var(--accent-gold)',
                fontSize: '1.2rem',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '0.05em',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '2px solid rgba(229, 104, 59, 0.2)',
                    borderTopColor: 'var(--accent-gold)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Carregando experiências...</span>
                </div>
              </div>
            ) : filteredReviews.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '30px',
              }}>
                {filteredReviews.map(review => (
                  <Link href={`/restaurant/${review.id}`} key={review.id} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                    <article className="glass-panel-gold" style={{
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}>
                    {/* Photo Container */}
                    <div style={{ height: '220px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={review.image} 
                        alt={review.name} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {/* Badges */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <span style={{
                          backgroundColor: 'rgba(7,7,7,0.75)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--accent-gold)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                        }}>
                          {review.cuisine}
                        </span>
                        <span style={{
                          backgroundColor: 'rgba(7,7,7,0.75)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                        }}>
                          {review.price} • R$ {review.spendPerPerson ?? review.spend_per_person ?? 150} / pessoa
                        </span>
                      </div>
                    </div>

                    {/* Body Content */}
                    {(() => {
                      const tasteVal = review.taste || 8;
                      const serviceVal = review.service || 8;
                      const ambianceVal = review.ambiance || 8;
                      const costBenefitVal = review.costBenefit ?? review.cost_benefit ?? 8;
                      const uxVal = review.ux ?? 8;
                      const avgScore = (tasteVal + serviceVal + ambianceVal + costBenefitVal + uxVal) / 5;
                      const starsCount = Math.max(1, Math.min(5, Math.round(avgScore / 2)));

                      return (
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            {/* Name & Stars */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <h3 className="serif-title" style={{ fontSize: '1.5rem', fontWeight: 500 }}>
                                {review.name}
                              </h3>
                              <div style={{ display: 'flex', gap: '2px', color: 'var(--accent-gold)' }} title={`${avgScore.toFixed(1)}/10 Média`}>
                                {Array.from({ length: starsCount }).map((_, i) => (
                                  <span key={i} className={getStarClass(starsCount)} style={{ fontSize: '1.1rem' }}>★</span>
                                ))}
                                {Array.from({ length: 5 - starsCount }).map((_, i) => (
                                  <span key={i} style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.15)' }}>★</span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Location */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={14} color="var(--accent-gold)" />
                              <span>{review.location}</span>
                            </div>
                          </div>

                          <div className="ratings-display" style={{
                            backgroundColor: 'rgba(205, 164, 94, 0.03)',
                            border: '1px solid rgba(205, 164, 94, 0.1)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.02)',
                          }}>
                            {[
                              { label: 'Sabor', value: tasteVal },
                              { label: 'Serviço', value: serviceVal },
                              { label: 'Ambiente', value: ambianceVal },
                              { label: 'Custo-Benefício', value: costBenefitVal },
                              { label: 'Experiência (UX)', value: uxVal },
                            ].map((item, index) => (
                              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {item.label}
                                  </span>
                                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.8rem' }}>{item.value}/10</span>
                                </div>
                                <div style={{
                                  height: '4px',
                                  width: '100%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                  position: 'relative'
                                }}>
                                  <div style={{
                                    width: `${item.value * 10}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--accent-gold), #ffe3b3)',
                                    borderRadius: '2px',
                                    boxShadow: '0 0 6px var(--accent-gold-glow)'
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Description */}
                          <p style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            color: 'var(--text-secondary)',
                            flex: 1,
                          }}>
                            "{review.description}"
                          </p>

                          {/* Card Footer */}
                          <div style={{
                            borderTop: '1px solid var(--border-light)',
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}>
                            <span>Por <strong style={{ color: 'var(--text-secondary)' }}>{review.author}</strong></span>
                            <span>{review.date}</span>
                          </div>
                        </div>
                      );
                    })()}
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                border: '1px dashed var(--border-light)',
                borderRadius: '16px',
                color: 'var(--text-secondary)',
              }}>
                <p>Nenhuma experiência gastronômica coincide com seus critérios.</p>
                <button 
                  onClick={() => { setSelectedCuisine('Todas'); setSearchQuery(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginTop: '10px',
                    fontWeight: 600,
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}

          </div>
        </section>

        {/* 4. Technical Stack Panel (Database) */}
        <section style={{
          padding: '100px 0',
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-light)',
        }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '8px 16px',
                background: 'var(--accent-gold-glow)',
                borderRadius: '30px',
                border: '1px solid var(--accent-gold)',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent-gold)',
              }}>
                <Database size={14} />
                <span>Next.js + Neon Serverless Postgres</span>
              </div>
              
              <h2 className="serif-title" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                Arquitetura de Banco de Dados Conectada
              </h2>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
                O backend do Crateristas foi integrado com o **Neon Postgres** via API Serverless. Suas avaliações são salvas e persistidas diretamente em nuvem de forma imediata.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
            }}>
              {/* Neon Integration Details */}
              <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-light)', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-gold)',
                  background: 'rgba(205,164,94,0.1)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}>
                  Ativo
                </div>

                <h3 className="serif-title" style={{ fontSize: '1.6rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={20} color="var(--accent-gold)" />
                  Neon Serverless SQL
                </h3>
                
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Conectado através do driver HTTP `@neondatabase/serverless` para respostas de sub-milissegundos e conexões escalonáveis sem limite.
                </p>

                <ul style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7',
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <li><strong>Auto-Escalonamento:</strong> Desliga automaticamente em idle para economizar recursos.</li>
                  <li><strong>HTTP connection string:</strong> Resolve gargalos tradicionais de pool de conexões do serverless.</li>
                  <li><strong>Segurança:</strong> Conexão HTTPS criptografada nativa.</li>
                </ul>
              </div>

              {/* Database Schema */}
              <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-light)' }}>
                <h3 className="serif-title" style={{ fontSize: '1.6rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={20} color="var(--accent-gold)" />
                  Tabela SQL: `reviews`
                </h3>
                
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Schema relacional criado automaticamente na primeira conexão para guardar as avaliações estruturadas:
                </p>

                <ul style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7',
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontFamily: 'monospace',
                }}>
                  <li>id: VARCHAR(50) [PK]</li>
                  <li>name: VARCHAR(255) [Restaurante]</li>
                  <li>cuisine: VARCHAR(100) [Culinária]</li>
                  <li>location: VARCHAR(255) [Cidade]</li>
                  <li>overall, taste, service, ambiance: INT</li>
                  <li>price: VARCHAR(10) | description: TEXT</li>
                  <li>image: TEXT | author: VARCHAR | date: VARCHAR</li>
                </ul>
              </div>
            </div>

            <div className="glass-panel" style={{
              marginTop: '30px',
              padding: '24px 30px',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              background: 'rgba(205,164,94,0.02)',
            }}>
              <Shield size={28} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                  Instruções de Implantação e Credenciais
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Configure a variável <code>DATABASE_URL</code> no seu arquivo <code>.env.local</code> localmente, ou nas configurações do projeto da <strong>Vercel</strong> para ativar a persistência real dos dados.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* 5. Footer */}
        <footer style={{
          borderTop: '1px solid var(--border-light)',
          padding: '40px 0',
          backgroundColor: '#050505',
          marginTop: 'auto',
        }}>
          <div className="container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}>
            <div>
              <span className="serif-title gold-gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                CRATERISTAS
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                © 2026 Clube Gastronômico Crateristas. Todos os direitos reservados.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <a href="#hero" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Voltar ao topo</a>
              <span>•</span>
              <span style={{ color: 'var(--accent-gold)' }}>Terroir & Alta Gastronomia</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Redirection to 3D Crater Scene Popup */}
      {showUpPopup && (
        <button 
          onClick={handleClimbUpRedirect}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-gold)',
            color: '#070707',
            padding: '14px 28px',
            borderRadius: '30px',
            boxShadow: '0 10px 30px rgba(229, 104, 59, 0.4)',
            fontWeight: '700',
            fontSize: '0.9rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(229, 104, 59, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(229, 104, 59, 0.4)';
          }}
        >
          <ArrowUp size={16} />
          <span>Ir para a arte 3D da cratera</span>
        </button>
      )}
    </div>
  );
}
