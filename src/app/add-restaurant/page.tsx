'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CUISINES = ['Italiana', 'Francesa', 'Japonesa', 'Espanhola', 'Fusão Contemporânea', 'Nórdica', 'Mexicana', 'Grelhados / Carnes'];
const PRICES = ['$', '$$', '$$$', '$$$$'];

const GOURMET_IMAGES = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', // Steak
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80', // Pasta
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80', // Sushi
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', // Fine dining plate
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=80', // Gourmet meat
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80', // Scallops
];

const getSliderBackground = (value: number) => {
  const percent = ((value - 1) / 9) * 100;
  let colors = '';
  if (value <= 4) {
    colors = '#ef4444, #f87171';
  } else if (value <= 7) {
    colors = '#eab308, #fbbf24';
  } else {
    colors = '#22c55e, #4ade80';
  }
  return `linear-gradient(to right, ${colors} ${percent}%, rgba(255, 255, 255, 0.06) ${percent}%)`;
};

const getStarClass = (rating: number) => {
  if (rating <= 2) return 'gradient-star-low';
  if (rating <= 4) return 'gradient-star-medium';
  return 'gradient-star-high';
};

export default function AddRestaurantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState(CUISINES[0]);
  const [location, setLocation] = useState('');
  const [taste, setTaste] = useState(8);
  const [service, setService] = useState(8);
  const [ambiance, setAmbiance] = useState(8);
  const [costBenefit, setCostBenefit] = useState(8);
  const [ux, setUx] = useState(8);
  const [price, setPrice] = useState('$$$');
  const [spendPerPerson, setSpendPerPerson] = useState(150);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isParsingMaps, setIsParsingMaps] = useState(false);

  // Dynamic Overall calculations
  const calculatedAverage = (taste + service + ambiance + costBenefit + ux) / 5;
  const calculatedOverall = Math.max(1, Math.min(5, Math.round(calculatedAverage / 2)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      fileList.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`A imagem ${file.name} é muito grande. Escolha imagens de até 5MB.`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const target = event.target;
          if (target?.result) {
            setImages(prev => [...prev, target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleParseMaps = async () => {
    if (!googleMapsUrl) {
      alert('Por favor, insira uma URL do Google Maps.');
      return;
    }
    setIsParsingMaps(true);
    try {
      const response = await fetch('/api/parse-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleMapsUrl }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const { name, location, cuisine, image } = result.data;
        if (name) setName(name);
        if (location) setLocation(location);
        if (cuisine) setCuisine(cuisine);
        if (image) setImages(prev => [image, ...prev]);
      } else {
        alert('Não foi possível extrair dados desse link. Verifique a URL do Google Maps.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao tentar importar do Google Maps.');
    } finally {
      setIsParsingMaps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const newReview = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      cuisine,
      location,
      overall: calculatedOverall,
      taste: Number(taste),
      service: Number(service),
      ambiance: Number(ambiance),
      costBenefit: Number(costBenefit),
      ux: Number(ux),
      spendPerPerson: Number(spendPerPerson),
      price,
      description,
      image: images[0] || GOURMET_IMAGES[0],
      images: images.length > 0 ? images : [images[0] || GOURMET_IMAGES[0]],
      author: 'Chef Admin',
      date: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReview),
      });
      const result = await response.json();
      
      if (result.success) {
        // Redirect to homepage
        router.push('/home#reviews');
        // Refresh page data
        router.refresh();
      } else {
        if (result.error && result.error.includes("Database not connected")) {
          // Fallback handling: save in localStorage temporarily for mock display if DB isn't set up
          const existingMock = localStorage.getItem('mock_reviews');
          const mockArray = existingMock ? JSON.parse(existingMock) : [];
          mockArray.unshift(newReview);
          localStorage.setItem('mock_reviews', JSON.stringify(mockArray));
          
          alert('Modo de Demonstração: Avaliação salva temporariamente em memória local do seu navegador! Para salvar no Postgres real, configure DATABASE_URL.');
          router.push('/home#reviews');
          router.refresh();
        } else {
          alert('Erro ao salvar no banco de dados: ' + (result.error || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error("Failed to add review:", error);
      alert('Erro de conexão. A avaliação foi adicionada temporariamente em memória local.');
      // Local fallback
      const existingMock = localStorage.getItem('mock_reviews');
      const mockArray = existingMock ? JSON.parse(existingMock) : [];
      mockArray.unshift(newReview);
      localStorage.setItem('mock_reviews', JSON.stringify(mockArray));
      router.push('/home#reviews');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      paddingTop: '120px',
      paddingBottom: '80px',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <Navbar isLoggedIn={true} onLoginToggle={() => {}} onOpenAddReview={() => {}} position="absolute" />
      </div>

      <main className="container" style={{ maxWidth: '800px' }}>
        
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

        <div className="glass-panel" style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid var(--border-gold)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--accent-gold-glow)',
        }}>
          <h2 className="serif-title" style={{
            fontSize: '2.4rem',
            marginBottom: '32px',
            color: 'var(--accent-gold)',
            fontWeight: 500,
          }}>
            Registrar Restaurante
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Google Maps Auto-Fill Tool */}
            <div style={{
              background: 'rgba(205, 164, 94, 0.03)',
              border: '1px dashed var(--border-gold)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '10px',
            }}>
              <label className="form-label" style={{ color: 'var(--accent-gold)', fontWeight: 700, margin: 0 }}>
                Importar dados via Google Maps (Auto-preenchimento)
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Cole o link do restaurante no Google Maps para preencher automaticamente o nome, endereço (bairro) e tipo de culinária.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://maps.app.goo.gl/... ou https://www.google.com/maps/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-gold"
                  onClick={handleParseMaps}
                  disabled={isParsingMaps}
                  style={{ padding: '0 24px', whiteSpace: 'nowrap', borderRadius: '8px' }}
                >
                  {isParsingMaps ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
            
            {/* Row 1: Restaurant Name & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-row">
              <div>
                <label className="form-label">Nome do Restaurante *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: D.O.M. ou Maní"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Localização *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Pinheiros, São Paulo - SP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: Cuisine, Price & Spend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="form-row">
              <div>
                <label className="form-label">Tipo de Culinária</label>
                <select 
                  className="form-input"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  {CUISINES.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: '#0a0a0a' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Faixa de Preço</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PRICES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(p)}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: '8px',
                        background: price === p ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.03)',
                        color: price === p ? '#070707' : 'var(--text-primary)',
                        border: '1px solid',
                        borderColor: price === p ? 'var(--accent-gold)' : 'var(--border-light)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.85rem'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Gasto por Pessoa (R$)</label>
                <input 
                  type="number"
                  className="form-input"
                  placeholder="Ex: 150"
                  value={spendPerPerson}
                  onChange={(e) => setSpendPerPerson(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <label className="form-label">Fotos do Restaurante/Pratos (Múltiplas)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* File Upload Input */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="file-upload-input"
                    />
                    <label 
                      htmlFor="file-upload-input"
                      className="btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-light)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>Selecionar Fotos</span>
                    </label>
                  </div>
                </div>

                {images.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                    {images.map((imgUrl, idx) => (
                      <div key={idx} style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-gold)',
                        background: '#111',
                        position: 'relative',
                      }}>
                        <img 
                          src={imgUrl} 
                          alt={`Preview ${idx + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.85)',
                            border: 'none',
                            color: '#ff4d4d',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            lineHeight: 1,
                            padding: 0,
                          }}
                          title="Remover foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-ratings */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(205, 164, 94, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(205, 164, 94, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}>
              <h4 style={{
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                Notas Detalhadas (1 a 10)
              </h4>
              
              {/* Taste */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Sabor & Tempero</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem' }}>{taste}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={taste} 
                  onChange={(e) => setTaste(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: getSliderBackground(taste),
                  }}
                />
              </div>

              {/* Service */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Serviço & Atendimento</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem' }}>{service}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={service} 
                  onChange={(e) => setService(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: getSliderBackground(service),
                  }}
                />
              </div>

              {/* Ambiance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Ambiente & Decoração</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem' }}>{ambiance}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={ambiance} 
                  onChange={(e) => setAmbiance(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: getSliderBackground(ambiance),
                  }}
                />
              </div>

              {/* Cost-Benefit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Custo-Benefício</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem' }}>{costBenefit}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={costBenefit} 
                  onChange={(e) => setCostBenefit(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: getSliderBackground(costBenefit),
                  }}
                />
              </div>

              {/* UX */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Experiência de Consumo (UX)</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem' }}>{ux}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={ux} 
                  onChange={(e) => setUx(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    background: getSliderBackground(ux),
                  }}
                />
              </div>
            </div>

            {/* Row 3: Overall Star Rating (Dynamically Calculated) */}
            <div style={{
              background: 'rgba(205, 164, 94, 0.05)',
              border: '1px solid rgba(205, 164, 94, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <label className="form-label" style={{ color: 'var(--accent-gold)', fontWeight: 700, margin: 0 }}>
                  Nota Geral Calculada
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  A média baseia-se nos 5 critérios detalhados.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', color: 'var(--accent-gold)' }}>
                  {Array.from({ length: calculatedOverall }).map((_, i) => (
                    <span key={i} className={getStarClass(calculatedOverall)} style={{ fontSize: '1.8rem' }}>★</span>
                  ))}
                  {Array.from({ length: 5 - calculatedOverall }).map((_, i) => (
                    <span key={i} style={{ fontSize: '1.8rem', color: 'rgba(255, 255, 255, 0.15)' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {calculatedAverage.toFixed(1)} / 10 Média ({calculatedOverall} Estrelas)
                </span>
              </div>
            </div>

            {/* Review Description */}
            <div>
              <label className="form-label">Relato da Experiência *</label>
              <textarea 
                className="form-input" 
                placeholder="Descreva os detalhes gastronômicos com profundidade crítica..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
                required
              />
            </div>

            {/* Footer Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '24px',
            }}>
              <Link href="/home#reviews" className="btn-outline">
                Cancelar
              </Link>
              <button 
                type="submit" 
                className="btn-gold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Experiência'}
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
}
