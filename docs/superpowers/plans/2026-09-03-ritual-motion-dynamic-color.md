# Ritual Motion and Dynamic Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar as páginas públicas do Crateristas ritualísticas e cinematográficas, usando movimento reutilizável, a fotografia real da Cratera no hero e uma atmosfera cromática derivada das fotos de cada restaurante.

**Architecture:** Um `MotionScope` cliente observa marcadores semânticos renderizados pelas páginas de servidor e executa animações progressivas sem esconder conteúdo quando JavaScript falha. A página de restaurante usa um módulo puro para selecionar a cor dominante e um `RestaurantAtmosphere` isolado para aplicar variáveis CSS locais; nenhum estado cromático é persistido.

**Tech Stack:** Next.js 16.2.7 App Router, React 19.2.4, TypeScript 5, CSS Modules, Web Animations/CSS transitions, Canvas 2D, Vitest 4.1.10 e Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-03-ritual-motion-dynamic-color-design.md`

## Global Constraints

- Não modificar `src/components/GourmetScene.tsx`, sua câmera, iluminação, ciclo temporal, modelos ou fluxo de navegação.
- Toda copy visível continua em português brasileiro.
- O alvo visual desta etapa é desktop em 1280, 1440 e 1920 pixels.
- Não adicionar bibliotecas, serviços pagos, tabelas, migrações ou novos contratos de API.
- Não implementar scroll hijacking, áudio automático, loops globais de `requestAnimationFrame` ou esperas antes de ações.
- Não gerar veredito textual nem interpretação automática das avaliações.
- Todo conteúdo deve permanecer visível e utilizável sem JavaScript.
- Toda animação deve possuir uma alternativa deliberada para `prefers-reduced-motion: reduce`.
- A cor extraída nunca controla a cor do texto principal nem o foco visível.
- A fotografia original `C:\Users\patho\Desktop\cratera.png` deve permanecer intacta; somente uma cópia entra no repositório.

---

## File Structure

### Novos arquivos

- `public/images/cratera.png` — cópia versionada da fotografia real usada no hero.
- `src/components/motion/MotionScope.tsx` — observação, redução de movimento e pausa de animações ambientais.
- `src/components/motion/MotionScope.test.tsx` — contrato progressivo e acessível do controlador.
- `src/components/motion/motion.module.css` — tokens e estados compartilhados de movimento.
- `src/features/home/CraterHeroMedia.tsx` — fotografia, selo editorial e expansão orientada pela rolagem nativa.
- `src/features/home/CraterHeroMedia.test.tsx` — conteúdo e cálculo de progresso do hero.
- `src/features/records/RecordGrid.test.tsx` — ordem e marcadores de movimento dos registros.
- `src/features/restaurant/photo-palette.ts` — seleção pura de paleta e amostragem 24 × 24.
- `src/features/restaurant/photo-palette.test.ts` — paleta dominante e fallbacks.
- `src/features/restaurant/RestaurantAtmosphere.tsx` — aplicação local das variáveis cromáticas.
- `src/features/restaurant/RestaurantAtmosphere.test.tsx` — carregamento, escopo e falha segura.

### Arquivos modificados

- `src/app/home/page.tsx` — instala `MotionScope` e marca seções editoriais.
- `src/features/home/LandingHero.tsx` — integra `CraterHeroMedia` e a ordem da narrativa.
- `src/features/home/HistoryPreview.tsx` — marcadores de inscrição e escavação.
- `src/features/home/MembersPreview.tsx` — constelação com ordem determinística.
- `src/features/home/RecentRestaurantsCarousel.tsx` — continuidade cinematográfica na troca manual.
- `src/features/home/home.module.css` — composição panorâmica e movimento da landing.
- `src/app/registros/page.tsx` — instala o escopo de movimento no arquivo.
- `src/features/records/RecordFilters.tsx` — feedback e marcador da ficha de busca.
- `src/features/records/RecordGrid.tsx` — stagger limitado dos cards.
- `src/features/records/records.module.css` — entrada e profundidade dos registros.
- `src/features/history/HistoryNarrative.tsx` — escopo da história e marcação de capítulos.
- `src/features/history/history.module.css` — inscrição, alternância e atmosfera ambiental.
- `src/features/members/MemberGrid.tsx` — marcação semântica da constelação pública.
- `src/features/members/MemberGrid.test.tsx` — preservação da ordem e índices.
- `src/features/restaurant/RestaurantReview.tsx` — integra atmosfera, movimento e sequência da mesa.
- `src/features/restaurant/PhotoGallery.tsx` — identifica a primeira foto e marca evidências.
- `src/features/restaurant/PhotoGallery.test.tsx` — seleção determinística da foto-fonte.
- `src/features/restaurant/ScoreBreakdown.tsx` — marca a medida coletiva.
- `src/features/restaurant/CommentFragments.tsx` — ordem radial e índices dos comentários.
- `src/features/restaurant/IndividualScoreDisclosure.tsx` — expansão por grid sem altura fixa.
- `src/features/restaurant/CommentFragments.test.tsx` — acessibilidade do disclosure animado.
- `src/features/restaurant/restaurant.module.css` — atmosfera local, galeria, notas e convergência.
- `src/components/ui/ScoreRing.tsx` — expõe o traço SVG ao estado de medida.
- `src/components/ui/ui.module.css` — completa o anel quando o estado fica visível.
- `src/components/ui/ui.test.tsx` — mantém o rótulo e o progresso semântico do anel.

---

### Task 1: Criar a fundação progressiva de movimento

**Files:**
- Create: `src/components/motion/MotionScope.tsx`
- Create: `src/components/motion/MotionScope.test.tsx`
- Create: `src/components/motion/motion.module.css`

**Interfaces:**
- Consumes: descendentes com `data-motion`, `data-motion-index` e `data-motion-loop`.
- Produces: `MotionScope({ children, className }: { children: ReactNode; className?: string }): ReactNode` e estados `data-motion-state="pending|visible"`.

- [ ] **Step 1: Escrever o teste que fixa o contrato de observação**

```tsx
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionScope } from './MotionScope';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('MotionScope', () => {
  it('mantém conteúdo no DOM e revela cada alvo uma única vez', () => {
    let notify: IntersectionObserverCallback = () => undefined;
    const observe = vi.fn();
    const unobserve = vi.fn();

    class ObserverMock {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = observe;
      unobserve = unobserve;
      disconnect = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', ObserverMock);
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

    render(
      <MotionScope>
        <h2 data-motion="inscription" data-motion-index="2">Arquivo vivo</h2>
      </MotionScope>,
    );

    const title = screen.getByRole('heading', { name: 'Arquivo vivo' });
    expect(title).toHaveAttribute('data-motion-state', 'pending');
    expect(observe).toHaveBeenCalledWith(title);

    act(() => notify([{ isIntersecting: true, target: title }] as IntersectionObserverEntry[], {} as IntersectionObserver));

    expect(title).toHaveAttribute('data-motion-state', 'visible');
    expect(unobserve).toHaveBeenCalledWith(title);
  });

  it('entrega o estado final quando movimento é reduzido', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    render(
      <MotionScope>
        <p data-motion="excavation">Registro</p>
        <span data-testid="ambient" data-motion-loop />
      </MotionScope>,
    );
    expect(screen.getByText('Registro')).toHaveAttribute('data-motion-state', 'visible');
    expect(screen.getByTestId('ambient')).toHaveAttribute('data-motion-loop-state', 'paused');
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha inicial**

Run: `npx vitest run src/components/motion/MotionScope.test.tsx`

Expected: FAIL porque `./MotionScope` ainda não existe.

- [ ] **Step 3: Implementar o controlador com um único observer**

```tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './motion.module.css';

export interface MotionScopeProps {
  children: ReactNode;
  className?: string;
}

export function MotionScope({ children, className }: MotionScopeProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = [...root.querySelectorAll<HTMLElement>('[data-motion]')];
    const loops = [...root.querySelectorAll<HTMLElement>('[data-motion-loop]')];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    root.dataset.motionReady = 'true';

    const showAll = () => {
      targets.forEach((target) => { target.dataset.motionState = 'visible'; });
      loops.forEach((loop) => { loop.dataset.motionLoopState = 'paused'; });
    };

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      showAll();
      return undefined;
    }

    targets.forEach((target) => {
      target.dataset.motionState = 'pending';
      target.style.setProperty('--motion-index', target.dataset.motionIndex ?? '0');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (target.hasAttribute('data-motion-loop')) {
          target.dataset.motionLoopState = entry.isIntersecting ? 'running' : 'paused';
        }
        if (entry.isIntersecting && target.hasAttribute('data-motion')) {
          target.dataset.motionState = 'visible';
          if (!target.hasAttribute('data-motion-loop')) observer.unobserve(target);
        }
      });
    }, { rootMargin: '0px 0px -12%', threshold: 0.12 });

    new Set([...targets, ...loops]).forEach((target) => observer.observe(target));

    const syncVisibility = () => {
      root.dataset.motionPaused = document.hidden ? 'true' : 'false';
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return (
    <div className={[styles.scope, className].filter(Boolean).join(' ')} ref={rootRef}>
      {children}
    </div>
  );
}
```

`motion.module.css` deve definir os quatro materiais sem conhecer layouts de página:

```css
.scope {
  --motion-fast: 180ms;
  --motion-routine: 360ms;
  --motion-authored: 680ms;
  --motion-ease: cubic-bezier(0.16, 1, 0.3, 1);
}

.scope[data-motion-ready='true'] [data-motion-state='pending'] {
  opacity: 0;
  transform: translate3d(var(--motion-x, 0), var(--motion-y, 28px), 0)
    scale(var(--motion-scale, 0.985));
}

.scope [data-motion-state='visible'] {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  transition:
    opacity var(--motion-authored) var(--motion-ease),
    transform var(--motion-authored) var(--motion-ease);
  transition-delay: min(calc(var(--motion-index, 0) * 48ms), 288ms);
}

.scope[data-motion-paused='true'] [data-motion-loop] {
  animation-play-state: paused !important;
}

.scope [data-motion-loop][data-motion-loop-state='paused'] {
  animation-play-state: paused !important;
}

@media (prefers-reduced-motion: reduce) {
  .scope [data-motion] {
    opacity: 1;
    transform: none;
    transition-duration: 120ms;
    transition-delay: 0ms;
  }
}
```

- [ ] **Step 4: Executar o teste da fundação**

Run: `npx vitest run src/components/motion/MotionScope.test.tsx`

Expected: PASS com 2 testes.

- [ ] **Step 5: Commitar a fundação**

```powershell
git add -- src/components/motion/MotionScope.tsx src/components/motion/MotionScope.test.tsx src/components/motion/motion.module.css
git commit -m "feat: add progressive public motion scope"
```

---

### Task 2: Transformar a fotografia da Cratera no momento focal do hero

**Files:**
- Create: `public/images/cratera.png`
- Create: `src/features/home/CraterHeroMedia.tsx`
- Create: `src/features/home/CraterHeroMedia.test.tsx`
- Modify: `src/features/home/LandingHero.tsx`
- Modify: `src/features/home/home.module.css`

**Interfaces:**
- Consumes: `MotionScope` da Task 1 e `C:\Users\patho\Desktop\cratera.png`.
- Produces: `CraterHeroMedia()` e `getHeroProgress(rectTop: number, rectHeight: number, viewportHeight: number): number`.

- [ ] **Step 1: Escrever os testes do conteúdo e do progresso**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CraterHeroMedia, getHeroProgress } from './CraterHeroMedia';

afterEach(cleanup);

describe('CraterHeroMedia', () => {
  it('publica a fotografia real com legenda editorial', () => {
    render(<CraterHeroMedia />);
    expect(screen.getByRole('img', { name: 'Registro do local da Cratera' }))
      .toHaveAttribute('src', expect.stringContaining('cratera.png'));
    expect(screen.getByText('Registro do local da Cratera')).toBeInTheDocument();
  });

  it('limita o progresso da abertura entre zero e um', () => {
    expect(getHeroProgress(0, 800, 800)).toBe(0);
    expect(getHeroProgress(-400, 800, 800)).toBeCloseTo(0.5);
    expect(getHeroProgress(-1200, 800, 800)).toBe(1);
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha inicial**

Run: `npx vitest run src/features/home/CraterHeroMedia.test.tsx`

Expected: FAIL porque `CraterHeroMedia` ainda não existe.

- [ ] **Step 3: Copiar a fotografia sem alterar o original**

```powershell
New-Item -ItemType Directory -Force -Path 'public\images' | Out-Null
Copy-Item -LiteralPath 'C:\Users\patho\Desktop\cratera.png' -Destination 'public\images\cratera.png'
```

Confirmar integridade sem imprimir conteúdo binário:

```powershell
Get-FileHash -Algorithm SHA256 'C:\Users\patho\Desktop\cratera.png'
Get-FileHash -Algorithm SHA256 'public\images\cratera.png'
```

Expected: os dois hashes são idênticos.

- [ ] **Step 4: Implementar mídia com atualização apenas em eventos de scroll**

```tsx
'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './home.module.css';

export function getHeroProgress(rectTop: number, rectHeight: number, viewportHeight: number) {
  const travel = Math.max(rectHeight, viewportHeight, 1);
  return Math.min(1, Math.max(0, -rectTop / travel));
}

export function CraterHeroMedia() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      root.style.setProperty('--hero-clip-x', '74%');
      root.style.setProperty('--hero-clip-y', '72%');
      root.style.setProperty('--hero-scale', '1');
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const progress = getHeroProgress(rect.top, rect.height, window.innerHeight);
      root.style.setProperty('--hero-clip-x', `${38 + progress * 42}%`);
      root.style.setProperty('--hero-clip-y', `${34 + progress * 44}%`);
      root.style.setProperty('--hero-scale', String(1.055 - progress * 0.055));
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <figure className={styles.craterHeroMedia} data-motion="excavation" ref={rootRef}>
      <div className={styles.craterHeroAperture}>
        <Image
          alt="Registro do local da Cratera"
          fill
          priority
          sizes="(max-width: 1440px) 62vw, 1120px"
          src="/images/cratera.png"
        />
        <span aria-hidden="true" className={styles.craterHeroContours} data-motion-loop />
      </div>
      <figcaption>Registro do local da Cratera</figcaption>
    </figure>
  );
}
```

`LandingHero.tsx` deve substituir o `craterContour` atual por `<CraterHeroMedia />`, manter o título antes da imagem no DOM e marcar título, lead e ação com `data-motion`.

`home.module.css` deve:

- manter o hero em duas áreas sobrepostas no desktop;
- usar `clip-path: ellipse(var(--hero-clip-x, 38%) var(--hero-clip-y, 34%) at 68% 51%)` somente na mídia;
- aplicar `transform: scale(var(--hero-scale, 1.055))` apenas na imagem;
- adicionar gradiente escuro localizado sob o texto;
- desenhar os contornos em pseudo-elementos, com um único loop lento;
- tornar o título visualmente superior à fotografia em `z-index` e contraste.

- [ ] **Step 5: Executar os testes do hero e da home**

Run: `npx vitest run src/features/home/CraterHeroMedia.test.tsx src/app/home/page.test.tsx`

Expected: PASS, preservando “Bem-vindo à cratera” e “Explorar restaurantes”.

- [ ] **Step 6: Commitar o hero fotográfico**

```powershell
git add -- public/images/cratera.png src/features/home/CraterHeroMedia.tsx src/features/home/CraterHeroMedia.test.tsx src/features/home/LandingHero.tsx src/features/home/home.module.css
git commit -m "feat: reveal crater photograph in landing hero"
```

---

### Task 3: Aplicar a coreografia ritual à landing page

**Files:**
- Modify: `src/app/home/page.tsx`
- Modify: `src/app/home/page.test.tsx`
- Modify: `src/features/home/HistoryPreview.tsx`
- Modify: `src/features/home/MembersPreview.tsx`
- Modify: `src/features/home/RecentRestaurantsCarousel.tsx`
- Modify: `src/features/home/RecentRestaurantsCarousel.test.tsx`
- Modify: `src/features/home/home.module.css`

**Interfaces:**
- Consumes: `MotionScope` e os quatro valores de `data-motion` da Task 1.
- Produces: uma única área observada em `/home`, índices determinísticos para integrantes e continuidade do carrossel.

- [ ] **Step 1: Expandir os testes com os marcadores semânticos**

Adicionar em `src/app/home/page.test.tsx`:

```tsx
it('marca as camadas editoriais para a coreografia pública', async () => {
  const { container } = render(await HomePage());
  expect(screen.getByRole('heading', { name: 'Bem-vindo à cratera' }))
    .toHaveAttribute('data-motion', 'inscription');
  expect(screen.getByRole('heading', { name: 'Restaurantes mais recentes' }))
    .toHaveAttribute('data-motion', 'inscription');
  expect(container.querySelectorAll('[data-motion="constellation"]')).toHaveLength(1);
});
```

Adicionar em `RecentRestaurantsCarousel.test.tsx`:

```tsx
it('reinicia somente a continuidade visual do slide selecionado', async () => {
  const user = userEvent.setup();
  render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B')]} />);
  expect(screen.getByRole('article', { name: 'Registro de A' }))
    .toHaveAttribute('data-carousel-state', 'active');
  await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));
  expect(screen.getByRole('article', { name: 'Registro de B' }))
    .toHaveAttribute('data-carousel-state', 'active');
});
```

- [ ] **Step 2: Executar os testes e confirmar que os marcadores faltam**

Run: `npx vitest run src/app/home/page.test.tsx src/features/home/RecentRestaurantsCarousel.test.tsx`

Expected: FAIL nas asserções de `data-motion` e `data-carousel-state`.

- [ ] **Step 3: Instalar o escopo e marcar a narrativa**

Em `src/app/home/page.tsx`, substituir o `div` externo por:

```tsx
<MotionScope className={styles.landing}>
  <DepthIndicator sections={DEPTH_SECTIONS} />
  <LandingHero />
  <section aria-labelledby="recent-title" className={styles.landingSection} id="restaurantes">
    <header className={styles.sectionHeader}>
      <h2 data-motion="inscription" id="recent-title">Restaurantes mais recentes</h2>
      <Link className={styles.textAction} href="/registros">Ver todos os registros</Link>
    </header>
    <RecentRestaurantsCarousel records={recentRestaurants} />
  </section>
  <HistoryPreview />
  <MembersPreview members={members} />
  <section aria-labelledby="closing-title" className={styles.closingCallout}>
    <h2 data-motion="inscription" id="closing-title">
      A próxima mesa ainda não foi registrada.
    </h2>
    <div>
      <Link className={styles.primaryAction} href="/registros">Explorar o arquivo</Link>
      <Link className={styles.textAction} href={viewer ? '/painel' : '/entrar'}>
        {viewer ? 'Abrir seu painel' : 'Entrar como integrante'}
      </Link>
    </div>
  </section>
</MotionScope>
```

Aplicar os atributos diretamente aos elementos existentes:

```tsx
<h2 data-motion="inscription" id="recent-title">Restaurantes mais recentes</h2>
<section
  aria-labelledby="history-preview-title"
  className={styles.historyPreview}
  data-motion="excavation"
  id="historia"
>
<div
  aria-label="Prévia dos integrantes"
  className={styles.memberConstellation}
  data-motion="constellation"
  role="list"
>
<article
  className={styles.memberPortrait}
  data-motion="constellation"
  data-motion-index={index}
  key={member.slug}
  role="listitem"
>
<article
  aria-label={`Registro de ${record.restaurant.name}`}
  className={styles.activeSlide}
  data-carousel-state="active"
  key={record.id}
>
```

Manter o `key={record.id}` do slide para que a transição aconteça somente quando o usuário escolhe outro registro.

- [ ] **Step 4: Refinar o material visual sem criar novos loops**

Em `home.module.css`:

```css
.memberPortrait[data-motion-state='pending'] {
  --motion-y: 44px;
  --motion-scale: 0.97;
}

.historyPreview[data-motion-state='pending'] {
  --motion-x: -48px;
  --motion-y: 0;
}

.activeSlide[data-carousel-state='active'] {
  animation: carousel-record-enter 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .activeSlide[data-carousel-state='active'] { animation: none; }
}
```

Acrescentar mudanças de enquadramento no hover somente dentro de `@media (hover: hover)` e nunca mover controles ou texto.

- [ ] **Step 5: Executar a suíte da home**

Run: `npx vitest run src/app/home/page.test.tsx src/features/home/*.test.tsx`

Expected: PASS para página, carrossel, profundidade e seleção de restaurantes.

- [ ] **Step 6: Commitar a coreografia da home**

```powershell
git add -- src/app/home/page.tsx src/app/home/page.test.tsx src/features/home/HistoryPreview.tsx src/features/home/MembersPreview.tsx src/features/home/RecentRestaurantsCarousel.tsx src/features/home/RecentRestaurantsCarousel.test.tsx src/features/home/home.module.css
git commit -m "feat: choreograph crater landing sections"
```

---

### Task 4: Animar o livro de registros sem atrasar os filtros

**Files:**
- Create: `src/features/records/RecordGrid.test.tsx`
- Modify: `src/app/registros/page.tsx`
- Modify: `src/features/records/RecordFilters.tsx`
- Modify: `src/features/records/RecordGrid.tsx`
- Modify: `src/features/records/records.module.css`

**Interfaces:**
- Consumes: `MotionScope` da Task 1 e `PublicVisitSummary[]` existente.
- Produces: cards `excavation` indexados na mesma ordem da lista pública.

- [ ] **Step 1: Escrever o teste da ordem e do stagger**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordGrid } from './RecordGrid';

vi.mock('./RecordCard', () => ({
  RecordCard: ({ record }: { record: { restaurant: { name: string } } }) => (
    <article>{record.restaurant.name}</article>
  ),
}));

afterEach(cleanup);

function record(id: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: `restaurante-${id}`,
      name,
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      priceBand: null,
    },
    visitedAt: '2026-08-30',
    publishedAt: '2026-08-31T12:00:00.000Z',
    coverPhotoUrl: null,
    participantCount: 6,
    averages: null,
    overall: 8,
  };
}

describe('RecordGrid', () => {
  it('mantém a ordem pública e limita o stagger por índice', () => {
    const records = [record('a', 'A'), record('b', 'B')];
    render(<RecordGrid records={records} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['A', 'B']);
    expect(items[0]).toHaveAttribute('data-motion', 'excavation');
    expect(items[0]).toHaveAttribute('data-motion-index', '0');
    expect(items[1]).toHaveAttribute('data-motion-index', '1');
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha inicial**

Run: `npx vitest run src/features/records/RecordGrid.test.tsx`

Expected: FAIL porque os itens ainda não têm `data-motion`.

- [ ] **Step 3: Envolver a página e marcar elementos existentes**

Em `src/app/registros/page.tsx`:

```tsx
<MotionScope className={styles.archive}>
  <header className={styles.archiveHeader}>
    <p className={styles.eyebrow}>Arquivo público</p>
    <h1 className={styles.archiveTitle} data-motion="inscription">Livro de registros</h1>
    <p className={styles.archiveLead}>
      Restaurantes visitados pela sociedade, preservados com a nota coletiva
      e o número de crateristas que contribuíram para cada relato.
    </p>
  </header>
  <RecordFilters filters={filters} />
  <RecordGrid records={records} />
</MotionScope>
```

Em `RecordFilters.tsx`, adicionar `data-motion="excavation"` ao formulário sem alterar `action`, `method` ou controles.

Em `RecordGrid.tsx`:

```tsx
{records.map((record, index) => (
  <div
    data-motion="excavation"
    data-motion-index={Math.min(index, 5)}
    key={record.id}
    role="listitem"
  >
    <RecordCard record={record} />
  </div>
))}
```

- [ ] **Step 4: Adicionar profundidade e hover seguro**

```css
.grid > [data-motion-state='pending'] {
  --motion-y: 42px;
  --motion-scale: 0.975;
}

.cardImage img {
  transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) {
  .card:hover .cardImage img { transform: scale(1.035); }
  .card:hover { border-color: color-mix(in srgb, var(--ember), var(--line) 45%); }
}

@media (prefers-reduced-motion: reduce) {
  .cardImage img { transition: none; }
  .card:hover .cardImage img { transform: none; }
}
```

- [ ] **Step 5: Executar os testes de registros**

Run: `npx vitest run src/app/registros/page.test.tsx src/features/records/*.test.tsx`

Expected: PASS, inclusive filtros, links e estado vazio.

- [ ] **Step 6: Commitar o livro animado**

```powershell
git add -- src/app/registros/page.tsx src/features/records/RecordFilters.tsx src/features/records/RecordGrid.tsx src/features/records/RecordGrid.test.tsx src/features/records/records.module.css
git commit -m "feat: animate public record excavation"
```

---

### Task 5: Dar ritmo aos capítulos e integrantes

**Files:**
- Modify: `src/features/history/HistoryNarrative.tsx`
- Modify: `src/features/history/HistoryNarrative.test.tsx`
- Modify: `src/features/history/history.module.css`
- Modify: `src/features/members/MemberGrid.tsx`
- Modify: `src/features/members/MemberGrid.test.tsx`

**Interfaces:**
- Consumes: `MotionScope`, capítulos de `CRATER_HISTORY` e até oito `PublicMemberSummary`.
- Produces: capítulos `excavation` alternados e integrantes `constellation` com índices de 0 a 7.

- [ ] **Step 1: Escrever testes dos marcadores sem alterar a ordem semântica**

Adicionar a `HistoryNarrative.test.tsx`:

```tsx
it('marca capítulos na mesma ordem da narrativa', () => {
  const { container } = render(<HistoryNarrative members={[]} showPanelLink={false} />);
  const chapters = [...container.querySelectorAll('[data-history-chapter]')];
  expect(chapters).toHaveLength(4);
  expect(chapters.every((chapter) => chapter.getAttribute('data-motion') === 'excavation'))
    .toBe(true);
  expect(chapters.map((chapter) => chapter.getAttribute('data-motion-index')))
    .toEqual(['0', '1', '2', '3']);
});
```

Adicionar a `MemberGrid.test.tsx` usando os fixtures existentes:

```tsx
const items = screen.getAllByRole('listitem');
expect(items[0]).toHaveAttribute('data-motion', 'constellation');
expect(items.map((item) => item.getAttribute('data-motion-index')))
  .toEqual(items.map((_, index) => String(index)));
```

- [ ] **Step 2: Executar os testes e confirmar que os atributos faltam**

Run: `npx vitest run src/features/history/HistoryNarrative.test.tsx src/features/members/MemberGrid.test.tsx`

Expected: FAIL nas novas asserções.

- [ ] **Step 3: Instalar o escopo e os índices**

Em `HistoryNarrative.tsx`, manter o `article` semântico dentro do escopo:

```tsx
<MotionScope>
  <article className={styles.story} data-motion-loop>
    <header className={styles.storyHero}>
      <h1 data-motion="inscription">{CRATER_HISTORY.title}</h1>
      <p data-motion="excavation">{CRATER_HISTORY.excerpt}</p>
    </header>
    <div className={styles.chapters}>
      {CRATER_HISTORY.chapters.map((chapter, index) => (
        <section
          data-history-chapter
          data-motion="excavation"
          data-motion-index={index}
          className={styles.chapter}
          id={chapter.id}
          key={chapter.id}
        >
          <div className={styles.chapterIndex}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{chapter.eyebrow}</p>
          </div>
          <div>
            <h2>{chapter.title}</h2>
            <p>{chapter.body}</p>
          </div>
        </section>
      ))}
    </div>
  </article>
</MotionScope>
```

Manter `HistoryHashTarget`, a seção `id="integrantes"` e o footer atuais dentro do mesmo `article`, depois de `chapters` e antes de `</article>`.

Em `MemberGrid.tsx`, marcar cada wrapper já existente:

```tsx
{visibleMembers.map((member, index) => (
  <div
    data-motion="constellation"
    data-motion-index={index}
    key={member.slug}
    role="listitem"
  >
    <MemberCard
      avatarUrl={getTrustedMemberAvatarUrl(member.avatarUrl)}
      bio={member.bio}
      displayName={member.displayName}
      favoriteCuisine={member.favoriteCuisine}
      memberNumber={member.memberNumber}
      publicContributionCount={member.contributions.publishedVisits}
      societyFragment={getSocietyFragmentForMember(member.memberNumber)}
      societyTitle={member.societyTitle}
    />
  </div>
))}
```

- [ ] **Step 4: Implementar alternância e um único ambiente contínuo**

```css
.chapter:nth-child(odd)[data-motion-state='pending'] {
  --motion-x: -52px;
  --motion-y: 0;
}

.chapter:nth-child(even)[data-motion-state='pending'] {
  --motion-x: 52px;
  --motion-y: 0;
}

.story::before {
  position: fixed;
  inset: 18% auto auto -12vw;
  width: 34vw;
  aspect-ratio: 1;
  content: '';
  border: 1px solid color-mix(in srgb, var(--ember), transparent 78%);
  border-radius: 47% 53% 55% 45%;
  pointer-events: none;
  animation: history-contour-breathe 14s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .story::before { animation: none; }
}
```

O pseudo-elemento deve permanecer decorativo, atrás do conteúdo e sem cobrir foco ou texto. Marcar seu contêiner com `data-motion-loop` para que `MotionScope` pause o loop quando necessário.

- [ ] **Step 5: Executar testes de história e membros**

Run: `npx vitest run src/app/historia/*.test.tsx src/features/history/*.test.tsx src/features/members/*.test.tsx`

Expected: PASS, inclusive o redirecionamento `#integrantes` e a ordem pública.

- [ ] **Step 6: Commitar a narrativa animada**

```powershell
git add -- src/features/history/HistoryNarrative.tsx src/features/history/HistoryNarrative.test.tsx src/features/history/history.module.css src/features/members/MemberGrid.tsx src/features/members/MemberGrid.test.tsx
git commit -m "feat: animate crater history and member constellation"
```

---

### Task 6: Implementar o motor cromático puro

**Files:**
- Create: `src/features/restaurant/photo-palette.ts`
- Create: `src/features/restaurant/photo-palette.test.ts`

**Interfaces:**
- Consumes: `Uint8ClampedArray` RGBA e `HTMLImageElement` já carregado.
- Produces: `derivePhotoPalette(pixels): PhotoPalette | null` e `samplePhotoPalette(image): PhotoPalette | null`.

- [ ] **Step 1: Escrever testes determinísticos da seleção cromática**

```ts
import { describe, expect, it, vi } from 'vitest';
import { derivePhotoPalette, samplePhotoPalette } from './photo-palette';

describe('derivePhotoPalette', () => {
  it('escolhe a família cromática dominante', () => {
    const pixels = new Uint8ClampedArray([
      24, 92, 210, 255,
      30, 102, 220, 255,
      212, 54, 42, 255,
    ]);
    const palette = derivePhotoPalette(pixels);
    expect(palette).not.toBeNull();
    expect(palette?.hue).toBeGreaterThan(205);
    expect(palette?.hue).toBeLessThan(230);
  });

  it('ignora transparência e imagens sem cromaticidade suficiente', () => {
    expect(derivePhotoPalette(new Uint8ClampedArray([
      120, 120, 120, 255,
      255, 0, 0, 20,
    ]))).toBeNull();
  });
});

describe('samplePhotoPalette', () => {
  it('amostra a imagem em 24 por 24 pixels', () => {
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => ({
      data: new Uint8ClampedArray([24, 92, 210, 255]),
    }));
    const context = { drawImage, getImageData } as unknown as CanvasRenderingContext2D;
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement);

    const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;
    expect(samplePhotoPalette(image)).not.toBeNull();
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 24, 24);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 24, 24);
  });
});
```

- [ ] **Step 2: Executar os testes e confirmar a falha inicial**

Run: `npx vitest run src/features/restaurant/photo-palette.test.ts`

Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar tipos, agrupamento e cores normalizadas**

```ts
export interface PhotoPalette {
  hue: number;
  accent: string;
  accentBright: string;
  surface: string;
  glow: string;
  line: string;
}

type HueBucket = { weight: number; sin: number; cos: number };

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation, lightness };
}

export function derivePhotoPalette(pixels: Uint8ClampedArray): PhotoPalette | null {
  const buckets = Array.from({ length: 15 }, (): HueBucket => ({ weight: 0, sin: 0, cos: 0 }));
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 128) continue;
    const color = rgbToHsl(pixels[index], pixels[index + 1], pixels[index + 2]);
    if (color.saturation < 0.18 || color.lightness < 0.1 || color.lightness > 0.9) continue;
    const bucket = buckets[Math.round(color.hue / 24) % buckets.length];
    const weight = color.saturation * (1 - Math.abs(color.lightness - 0.5));
    const radians = color.hue * Math.PI / 180;
    bucket.weight += weight;
    bucket.sin += Math.sin(radians) * weight;
    bucket.cos += Math.cos(radians) * weight;
  }
  const dominant = buckets.reduce((best, candidate) => (
    candidate.weight > best.weight ? candidate : best
  ));
  if (dominant.weight === 0) return null;
  const hue = Math.round((Math.atan2(dominant.sin, dominant.cos) * 180 / Math.PI + 360) % 360);
  return {
    hue,
    accent: `hsl(${hue} 62% 48%)`,
    accentBright: `hsl(${hue} 72% 68%)`,
    surface: `hsl(${hue} 24% 13%)`,
    glow: `hsl(${hue} 72% 52% / 0.18)`,
    line: `hsl(${hue} 38% 32%)`,
  };
}

export function samplePhotoPalette(image: HTMLImageElement): PhotoPalette | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, 24, 24);
    return derivePhotoPalette(context.getImageData(0, 0, 24, 24).data);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Executar testes do motor cromático**

Run: `npx vitest run src/features/restaurant/photo-palette.test.ts`

Expected: PASS para dominância, descarte e amostra 24 × 24.

- [ ] **Step 5: Commitar o motor cromático**

```powershell
git add -- src/features/restaurant/photo-palette.ts src/features/restaurant/photo-palette.test.ts
git commit -m "feat: derive restaurant palette from visit photo"
```

---

### Task 7: Aplicar a atmosfera cromática na página do restaurante

**Files:**
- Create: `src/features/restaurant/RestaurantAtmosphere.tsx`
- Create: `src/features/restaurant/RestaurantAtmosphere.test.tsx`
- Modify: `src/features/restaurant/RestaurantReview.tsx`
- Modify: `src/features/restaurant/PhotoGallery.tsx`
- Modify: `src/features/restaurant/PhotoGallery.test.tsx`
- Modify: `src/features/restaurant/restaurant.module.css`

**Interfaces:**
- Consumes: `samplePhotoPalette(image)` da Task 6 e a primeira foto ordenada da galeria.
- Produces: `RestaurantAtmosphere({ children, enabled })` e cinco variáveis CSS locais.

- [ ] **Step 1: Escrever os testes do escopo e do fallback**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestaurantAtmosphere } from './RestaurantAtmosphere';
import * as paletteModule from './photo-palette';

describe('RestaurantAtmosphere', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('aplica a paleta somente no wrapper ao carregar a foto-fonte', () => {
    vi.spyOn(paletteModule, 'samplePhotoPalette').mockReturnValue({
      hue: 212,
      accent: 'hsl(212 62% 48%)',
      accentBright: 'hsl(212 72% 68%)',
      surface: 'hsl(212 24% 13%)',
      glow: 'hsl(212 72% 52% / 0.18)',
      line: 'hsl(212 38% 32%)',
    });
    const { container } = render(
      <RestaurantAtmosphere enabled>
        <img alt="Visita" data-atmosphere-source="true" src="/foto.png" />
      </RestaurantAtmosphere>,
    );
    fireEvent.load(screen.getByRole('img', { name: 'Visita' }));
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--atmosphere-accent'))
      .toBe('hsl(212 62% 48%)');
    expect(document.documentElement.style.getPropertyValue('--atmosphere-accent')).toBe('');
  });

  it('mantém a identidade padrão quando a amostragem falha', () => {
    vi.spyOn(paletteModule, 'samplePhotoPalette').mockReturnValue(null);
    const { container } = render(
      <RestaurantAtmosphere enabled>
        <img alt="Visita" data-atmosphere-source="true" src="/foto.png" />
      </RestaurantAtmosphere>,
    );
    fireEvent.load(screen.getByRole('img', { name: 'Visita' }));
    expect((container.firstElementChild as HTMLElement).getAttribute('style')).toBeNull();
  });
});
```

- [ ] **Step 2: Executar os testes e confirmar a falha inicial**

Run: `npx vitest run src/features/restaurant/RestaurantAtmosphere.test.tsx`

Expected: FAIL porque o componente ainda não existe.

- [ ] **Step 3: Implementar captura de carregamento e variáveis locais**

```tsx
'use client';

import { useCallback, useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { samplePhotoPalette } from './photo-palette';
import styles from './restaurant.module.css';

export function RestaurantAtmosphere({ children, enabled }: {
  children: ReactNode;
  enabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  const applyFromImage = useCallback((image: HTMLImageElement) => {
    if (!enabled || image.dataset.atmosphereSource !== 'true') return;
    const palette = samplePhotoPalette(image);
    const root = rootRef.current;
    if (!palette || !root) return;
    root.style.setProperty('--atmosphere-accent', palette.accent);
    root.style.setProperty('--atmosphere-accent-bright', palette.accentBright);
    root.style.setProperty('--atmosphere-surface', palette.surface);
    root.style.setProperty('--atmosphere-glow', palette.glow);
    root.style.setProperty('--atmosphere-line', palette.line);
    root.dataset.atmosphereReady = 'true';
  }, [enabled]);

  useEffect(() => {
    const image = rootRef.current?.querySelector<HTMLImageElement>('[data-atmosphere-source="true"]');
    if (image?.complete && image.naturalWidth > 0) applyFromImage(image);
  }, [applyFromImage]);

  const handleLoadCapture = (event: SyntheticEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLImageElement) applyFromImage(event.target);
  };

  return (
    <div className={styles.atmosphere} onLoadCapture={handleLoadCapture} ref={rootRef}>
      {children}
    </div>
  );
}
```

Em `PhotoGallery.tsx`, marcar somente a primeira foto depois da ordenação:

```tsx
<Image
  alt={`Foto ${index + 1} da visita ao restaurante ${restaurantName}`}
  data-atmosphere-source={index === 0 ? 'true' : undefined}
  height={800}
  sizes="(max-width: 1440px) 50vw, 680px"
  src={photo.url}
  width={1200}
/>
```

Em `RestaurantReview.tsx`, envolver o artigo sem mudar seus props:

```tsx
<RestaurantAtmosphere enabled={photos.length > 0}>
  <article className={styles.reviewPage}>
    <Link className={styles.backLink} href="/registros">
      ← Voltar ao livro de registros
    </Link>
    <header className={styles.reviewHeader}>
      <p className={styles.eyebrow}>Evidências de uma visita publicada</p>
      <h1>{restaurant.name}</h1>
      <div className={styles.restaurantMeta}>
        <span>{restaurant.cuisine}</span>
        <span aria-hidden="true">•</span>
        <span>{restaurant.neighborhood}, {restaurant.city}</span>
      </div>
      <p className={styles.visitDate}>
        Visita em <time dateTime={visitedAt}>{formatVisitDate(visitedAt)}</time>
      </p>
      {restaurant.address ? <p className={styles.address}>{restaurant.address}</p> : null}
    </header>
    <PhotoGallery photos={photos} restaurantName={restaurant.name} />
    <section aria-labelledby="evidencias-titulo" className={styles.evidenceSection}>
      <header className={styles.evidenceHeader}>
        <p className={styles.eyebrow}>Caderno coletivo</p>
        <h2 id="evidencias-titulo">Vozes e medidas da mesa</h2>
        <p>As impressões publicadas permanecem junto das médias coletivas da visita.</p>
      </header>
      <div className={styles.evidenceComposition}>
        <div className={styles.scorePanel}>
          <ScoreBreakdown
            historical={historical}
            overall={overall}
            participantCount={participantCount}
            scores={scores}
          />
        </div>
        <CommentFragments comments={comments} />
      </div>
    </section>
  </article>
</RestaurantAtmosphere>
```

- [ ] **Step 4: Usar variáveis locais apenas na decoração**

```css
.atmosphere {
  --review-accent: var(--atmosphere-accent, var(--ember));
  --review-accent-bright: var(--atmosphere-accent-bright, var(--ember-bright));
  --review-surface: var(--atmosphere-surface, var(--surface));
  --review-line: var(--atmosphere-line, var(--line));
  position: relative;
  isolation: isolate;
}

.atmosphere::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  background: radial-gradient(circle at 78% 12%, var(--atmosphere-glow, transparent), transparent 42%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.atmosphere[data-atmosphere-ready='true']::before { opacity: 1; }
```

Substituir somente os acentos decorativos da página por `--review-accent`, `--review-accent-bright`, `--review-surface` e `--review-line`. Manter `--ink`, `--ink-muted` e o outline global sem alteração.

- [ ] **Step 5: Executar os testes de atmosfera e galeria**

Run: `npx vitest run src/features/restaurant/RestaurantAtmosphere.test.tsx src/features/restaurant/PhotoGallery.test.tsx src/app/restaurantes/[slug]/page.test.tsx`

Expected: PASS, com apenas a primeira foto marcada e fallback sem estilo inline.

- [ ] **Step 6: Commitar a atmosfera cromática**

```powershell
git add -- src/features/restaurant/RestaurantAtmosphere.tsx src/features/restaurant/RestaurantAtmosphere.test.tsx src/features/restaurant/RestaurantReview.tsx src/features/restaurant/PhotoGallery.tsx src/features/restaurant/PhotoGallery.test.tsx src/features/restaurant/restaurant.module.css
git commit -m "feat: color restaurant pages from visit photography"
```

---

### Task 8: Coreografar galeria, medida coletiva e comentários

**Files:**
- Modify: `src/features/restaurant/RestaurantReview.tsx`
- Modify: `src/features/restaurant/PhotoGallery.tsx`
- Modify: `src/features/restaurant/ScoreBreakdown.tsx`
- Modify: `src/features/restaurant/CommentFragments.tsx`
- Modify: `src/features/restaurant/IndividualScoreDisclosure.tsx`
- Modify: `src/features/restaurant/CommentFragments.test.tsx`
- Modify: `src/features/restaurant/restaurant.module.css`
- Modify: `src/components/ui/ScoreRing.tsx`
- Modify: `src/components/ui/ui.module.css`
- Modify: `src/components/ui/ui.test.tsx`

**Interfaces:**
- Consumes: `MotionScope`, `RestaurantAtmosphere` e os dados públicos atuais.
- Produces: sequência `inscription → excavation → measure → constellation`, traço `data-score-progress` e disclosure montado com estado acessível.

- [ ] **Step 1: Escrever testes de medida, comentários e disclosure**

Em `ui.test.tsx`, acrescentar à asserção do anel:

```tsx
const ring = screen.getByRole('img', { name: 'Comida: 8,3 de 10' });
expect(ring.querySelector('[data-score-progress]')).toHaveAttribute('stroke-dasharray', '82.5 100');
```

Em `CommentFragments.test.tsx`, dentro do teste de ordem:

```tsx
expect(fragments.map((fragment) => fragment.getAttribute('data-motion')))
  .toEqual(fragments.map(() => 'constellation'));
expect(fragments.map((fragment) => fragment.getAttribute('data-motion-index')))
  .toEqual(fragments.map((_, index) => String(index)));
```

E no teste do disclosure:

```tsx
const anaPanel = document.querySelector('[data-score-disclosure="Ana Souza"]');
expect(anaPanel).toHaveAttribute('data-expanded', 'false');
await user.click(anaToggle);
expect(anaPanel).toHaveAttribute('data-expanded', 'true');
expect(anaToggle).toHaveAttribute('aria-expanded', 'true');
```

- [ ] **Step 2: Executar os testes e confirmar as falhas de contrato**

Run: `npx vitest run src/components/ui/ui.test.tsx src/features/restaurant/CommentFragments.test.tsx`

Expected: FAIL porque o traço, os índices e o painel persistente ainda não existem.

- [ ] **Step 3: Marcar a sequência no detalhe do restaurante**

Em `RestaurantReview.tsx`:

```tsx
<RestaurantAtmosphere enabled={photos.length > 0}>
  <MotionScope>
    <article className={styles.reviewPage}>
```

Adicionar a marca ao título existente:

```tsx
<h1 data-motion="inscription">{restaurant.name}</h1>
```

Fechar os wrappers depois do `</article>` existente:

```tsx
  </MotionScope>
</RestaurantAtmosphere>
```

Em `PhotoGallery.tsx`, marcar cada `figure` com `data-motion="excavation"` e `data-motion-index={Math.min(index, 5)}`.

Em `ScoreBreakdown.tsx`, adicionar `data-motion="measure"` ao `section`.

Em `CommentFragments.tsx`:

```tsx
<li
  className={`${styles.commentFragment} ${styles[`fragment--${slot}`]}`}
  data-motion="constellation"
  data-motion-index={index}
  key={comment.memberId}
>
```

- [ ] **Step 4: Expor o traço SVG e animá-lo pelo estado do ancestral**

Em `ScoreRing.tsx`:

```tsx
<circle
  className={styles.scoreProgress}
  cx="22"
  cy="22"
  data-score-progress
  r="19"
  pathLength="100"
  strokeDasharray={`${progress} 100`}
/>
```

Em `ui.module.css`:

```css
[data-motion='measure'][data-motion-state='pending'] [data-score-progress] {
  stroke-dashoffset: 100;
}

[data-motion='measure'][data-motion-state='visible'] [data-score-progress] {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 720ms cubic-bezier(0.16, 1, 0.3, 1) 100ms;
}

@media (prefers-reduced-motion: reduce) {
  [data-score-progress] { stroke-dashoffset: 0; transition: none; }
}
```

- [ ] **Step 5: Manter o disclosure montado e animar por grid**

Substituir a renderização condicional em `IndividualScoreDisclosure.tsx` por:

```tsx
<div
  className={styles.individualScoresClip}
  data-expanded={expanded}
  data-score-disclosure={displayName}
>
  <div>
    <section
      aria-hidden={!expanded}
      aria-label={`Notas de ${displayName}`}
      className={styles.individualScores}
      id={regionId}
    >
      <div className={styles.individualOverall}>
        <span>Média pessoal</span>
        <strong>{scoreFormatter.format(overall)}</strong>
      </div>
      <dl className={styles.individualScoreList}>
        {SCORE_ROWS.map(({ key, label }) => (
          <div className={styles.individualScore} key={key}>
            <dt>{label}</dt>
            <dd>{scoreFormatter.format(scores[key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  </div>
</div>
```

```css
.individualScoresClip {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}

.individualScoresClip > div { min-height: 0; overflow: hidden; }

.individualScoresClip[data-expanded='true'] {
  grid-template-rows: 1fr;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .individualScoresClip { transition: none; }
}
```

Como o conteúdo expandido não possui controles internos, `aria-hidden` é suficiente para removê-lo da árvore acessível quando fechado. O botão mantém `aria-controls` e `aria-expanded`.

- [ ] **Step 6: Definir a convergência radial e a estabilidade final**

Em `restaurant.module.css`, cada slot define somente o vetor inicial:

```css
.fragment--1 { --fragment-x: 72px; --fragment-y: 80px; }
.fragment--2 { --fragment-x: -72px; --fragment-y: 80px; }
.fragment--3 { --fragment-x: 96px; --fragment-y: 20px; }
.fragment--4 { --fragment-x: -96px; --fragment-y: 20px; }
.fragment--5 { --fragment-x: 96px; --fragment-y: -20px; }
.fragment--6 { --fragment-x: -96px; --fragment-y: -20px; }
.fragment--7 { --fragment-x: 72px; --fragment-y: -80px; }
.fragment--8 { --fragment-x: -72px; --fragment-y: -80px; }

.commentFragment[data-motion-state='pending'] {
  --motion-x: var(--fragment-x);
  --motion-y: var(--fragment-y);
  --motion-scale: 0.96;
}
```

Depois de `visible`, os cards permanecem sem animação contínua. A galeria pode alterar escala apenas no hover.

- [ ] **Step 7: Executar a suíte do restaurante**

Run: `npx vitest run src/features/restaurant/*.test.tsx src/features/restaurant/*.test.ts src/components/ui/ui.test.tsx src/app/restaurantes/[slug]/*.test.tsx`

Expected: PASS para galeria, paleta, comentários, notas, página, erro e ausência de registro.

- [ ] **Step 8: Commitar a coreografia da mesa**

```powershell
git add -- src/features/restaurant/RestaurantReview.tsx src/features/restaurant/PhotoGallery.tsx src/features/restaurant/ScoreBreakdown.tsx src/features/restaurant/CommentFragments.tsx src/features/restaurant/IndividualScoreDisclosure.tsx src/features/restaurant/CommentFragments.test.tsx src/features/restaurant/restaurant.module.css src/components/ui/ScoreRing.tsx src/components/ui/ui.module.css src/components/ui/ui.test.tsx
git commit -m "feat: choreograph collective restaurant evidence"
```

---

### Task 9: Verificar integração, acessibilidade e desempenho visual

**Files:**
- Modify only if a check reveals a regression: files changed in Tasks 1–8.
- Update generated graph output: `graphify-out/` (ignored from Git).

**Interfaces:**
- Consumes: todas as entregas anteriores.
- Produces: build validado, relatório mecânico do Impeccable, grafo atualizado e evidência visual nos três viewports desktop.

- [ ] **Step 1: Executar os testes completos**

Run: `npm test`

Expected: todos os 448 testes de base e os novos testes passam; os 21 testes já ignorados continuam identificados, sem novos skips.

- [ ] **Step 2: Executar verificação estática**

Run: `npm run lint`

Expected: exit code 0, sem novos erros.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Executar o build sem disparar a migração local**

Run: `npx next build`

Expected: build de produção concluído. Usar `npx next build`, e não `npm run build`, porque o script `prebuild` exige `DATABASE_URL` para a migração.

- [ ] **Step 4: Executar o detector mecânico do Impeccable uma única vez**

```powershell
node 'C:\Users\patho\.agents\skills\impeccable\scripts\detect.mjs' --json src/components/motion src/features/home src/features/records src/features/history src/features/members/MemberGrid.tsx src/features/restaurant src/components/ui/ScoreRing.tsx src/components/ui/ui.module.css
```

Expected: nenhum bloqueio de contraste, foco, movimento, semântica ou desempenho. Corrigir todos os achados reais em um único lote e repetir somente os testes afetados.

- [ ] **Step 5: Fazer uma rodada visual desktop**

Iniciar o servidor com ambiente Preview já vinculado e executar a skill `vercel:agent-browser-verify`. Depois usar `vercel:agent-browser` para inspecionar, nas larguras 1280, 1440 e 1920:

- `/home`: título como primeira leitura, abertura da fotografia, panorama durante scroll e carrossel por teclado;
- `/registros`: filtros imediatos, cards em ordem, hover e estado vazio;
- `/historia`: quatro capítulos, hash `#integrantes`, retratos e easter eggs sem sobreposição;
- `/restaurantes/[slug]`: paleta com foto, fallback sem foto, galeria, nota e todos os disclosures;
- preferência de movimento reduzido;
- console sem novos erros.

Expected: nenhuma sobreposição, corte de texto, perda de foco, salto de layout ou animação persistente fora da viewport.

- [ ] **Step 6: Corrigir a rodada em um lote e confirmar uma única vez**

Aplicar somente correções demonstradas pela inspeção. Reexecutar testes afetados, detector somente se a correção tocar um padrão sinalizado e uma confirmação visual final nos mesmos três viewports.

- [ ] **Step 7: Atualizar o grafo local**

Run: `graphify update .`

Expected: atualização AST concluída sem custo de API; `graphify-out/` permanece ignorado.

- [ ] **Step 8: Conferir que a cena protegida não mudou**

```powershell
git diff main...HEAD -- src/components/GourmetScene.tsx
```

Expected: nenhuma saída.

- [ ] **Step 9: Conferir o conjunto final e commitar eventuais correções verificadas**

```powershell
git status --short
git diff --check
git diff --stat main...HEAD
```

Se a rodada gerou correções rastreáveis:

```powershell
git add -- src public/images/cratera.png
git commit -m "fix: polish ritual motion across public pages"
```

Expected: worktree limpo, somente arquivos previstos alterados e nenhuma credencial ou `.env` versionado.
