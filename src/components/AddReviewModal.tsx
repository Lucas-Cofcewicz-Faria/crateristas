'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface AddReviewModalProps {
  onClose: () => void;
  onSubmit: (review: {
    id: string;
    name: string;
    cuisine: string;
    location: string;
    overall: number;
    taste: number;
    service: number;
    ambiance: number;
    costBenefit?: number;
    ux?: number;
    spendPerPerson?: number;
    price: string;
    description: string;
    image: string;
    author: string;
    date: string;
  }) => void;
}

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

export default function AddReviewModal({ onClose, onSubmit }: AddReviewModalProps) {
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
  const [image, setImage] = useState('');

  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isParsingMaps, setIsParsingMaps] = useState(false);

  // Dynamic Overall calculations
  const calculatedAverage = (taste + service + ambiance + costBenefit + ux) / 5;
  const calculatedOverall = Math.max(1, Math.min(5, Math.round(calculatedAverage / 2)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
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
        if (image) setImage(image);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

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
      image: image || GOURMET_IMAGES[0],
      author: 'Chef Amigo',
      date: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    onSubmit(newReview);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '700px',
        backgroundColor: '#0a0a0a',
        border: '1px solid var(--border-gold)',
        borderRadius: '20px',
        padding: '32px',
        position: 'relative',
        boxShadow: '0 24px 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--accent-gold-glow)',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <h2 className="serif-title" style={{
          fontSize: '2rem',
          marginBottom: '28px',
          color: 'var(--accent-gold)',
        }}>
          Registrar Restaurante
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Google Maps Auto-Fill Tool */}
          <div style={{
            background: 'rgba(205, 164, 94, 0.03)',
            border: '1px dashed var(--border-gold)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '8px',
          }}>
            <label className="form-label" style={{ color: 'var(--accent-gold)', fontWeight: 700, margin: 0 }}>
              Importar via Google Maps (Auto-preenchimento)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Cole o link do Google Maps aqui..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-gold"
                onClick={handleParseMaps}
                disabled={isParsingMaps}
                style={{ padding: '0 20px', whiteSpace: 'nowrap', borderRadius: '8px' }}
              >
                {isParsingMaps ? '...' : 'Importar'}
              </button>
            </div>
          </div>
          
          {/* Row 1: Restaurant Name & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
            <label className="form-label">Foto do Restaurante/Prato</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* File Upload Input */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="modal-file-upload-input"
                  />
                  <label 
                    htmlFor="modal-file-upload-input"
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
                    <span>Carregar Foto</span>
                  </label>
                </div>
              </div>

              {image && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-gold)',
                    background: '#111',
                  }}>
                    <img 
                      src={image} 
                      alt="Preview da Imagem" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Imagem carregada do seu computador
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-ratings */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(205, 164, 94, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid rgba(205, 164, 94, 0.15)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              Notas Detalhadas (1 a 10)
            </h4>
            
            {/* Taste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Sabor & Tempero</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem' }}>{taste}/10</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Serviço & Atendimento</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem' }}>{service}/10</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Ambiente & Decoração</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem' }}>{ambiance}/10</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Custo-Benefício</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem' }}>{costBenefit}/10</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Experiência de Consumo (UX)</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem' }}>{ux}/10</span>
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {calculatedAverage.toFixed(1)} / 10 Média ({calculatedOverall} Estrelas)
              </span>
            </div>
          </div>

          {/* Review Description */}
          <div>
            <label className="form-label">Relato da Experiência *</label>
            <textarea 
              className="form-input" 
              placeholder="Descreva os detalhes gastronômicos. Destaque os pratos especiais, harmonização de vinhos, a técnica do chef e a atmosfera do local..."
              rows={4}
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
            paddingTop: '20px',
          }}>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-gold">
              Registrar Experiência
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
