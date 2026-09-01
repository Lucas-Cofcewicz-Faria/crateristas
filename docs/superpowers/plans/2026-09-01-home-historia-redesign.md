# Home e História da Cratera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar `/home` na landing page editorial dos Crateristas, criar `/historia` com a narrativa e os integrantes, e encaminhar a descida Three.js para essa nova home sem alterar sua animação.

**Architecture:** As rotas públicas permanecem Server Components e carregam as projeções existentes do repositório em paralelo. A seleção de restaurantes fica em uma função pura; somente o carrossel e o indicador de profundidade são Client Components. Conteúdo canônico, composição visual e estado interativo vivem em módulos separados para permitir futuras iterações sem tocar no banco ou na cena 3D.

**Tech Stack:** Next.js 16.2.7 App Router, React 19.2.4, TypeScript 5, CSS Modules, `next/image`, `lucide-react`, Vitest 4.1.10, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-home-historia-redesign-design.md`

## Global Constraints

- Ler completamente o spec acima e `PRODUCT.md` antes da primeira tarefa.
- Por `AGENTS.md`, ler antes de editar as rotas: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `04-linking-and-navigating.md`, `05-server-and-client-components.md`, `10-error-handling.md`, `11-css.md`, `12-images.md`, `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md` e `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`.
- Antes da primeira edição de UI, carregar `C:/Users/patho/.agents/skills/impeccable/reference/craft-floor.md`; o contexto Impeccable já foi executado nesta sessão e não deve ser executado novamente.
- Todo texto visível deve estar em português brasileiro, com acentuação correta.
- O alvo de acabamento é desktop a partir de 1024 px, validado em 1440 px; não desenvolver a versão mobile completa nesta etapa.
- Não adicionar dependências, endpoints, migrações ou novos métodos do repositório.
- Não inventar imagens, restaurantes, membros, datas ou avaliações.
- Não gerar um veredito textual; a nota coletiva existente continua sendo a síntese numérica.
- Não editar `src/components/GourmetScene.tsx`, `src/components/crater-atmosphere.ts` ou qualquer lógica Three.js. Em `src/app/page.tsx`, alterar somente o destino de `router.push` e o comentário imediatamente acima dele.
- Respeitar teclado, foco visível, landmarks, `aria-live`, texto alternativo e `prefers-reduced-motion`.
- Não executar o detector Impeccable durante as tarefas intermediárias; executá-lo uma única vez no Task 7.
- Depois de todas as mudanças de código, executar `graphify update .`; nunca adicionar `graphify-out/` ao Git.

## File Structure

### Criar

- `src/content/crater-history.ts` — única fonte do resumo, título e quatro capítulos canônicos.
- `src/features/home/select-recent-restaurants.ts` — seleção pura de até seis restaurantes únicos.
- `src/features/home/select-recent-restaurants.test.ts` — ordem, deduplicação, limite e imutabilidade.
- `src/features/home/RecentRestaurantsCarousel.tsx` — interação client-side do carrossel e estado vazio.
- `src/features/home/RecentRestaurantsCarousel.test.tsx` — controles, teclado, indicadores e fallback.
- `src/features/home/DepthIndicator.tsx` — indicador client-side da seção observada.
- `src/features/home/DepthIndicator.test.tsx` — âncoras e atualização por `IntersectionObserver`.
- `src/features/home/LandingHero.tsx` — primeira dobra e CTA primário.
- `src/features/home/HistoryPreview.tsx` — resumo e CTA para a história.
- `src/features/home/MembersPreview.tsx` — composição de até oito perfis públicos reais.
- `src/features/home/home.module.css` — sistema visual da landing, carrossel, indicador e estados de rota.
- `src/app/home/loading.tsx`, `error.tsx`, `route-states.test.tsx` — estados explícitos da rota dinâmica.
- `src/features/history/HistoryNarrative.tsx` — quatro capítulos, integrantes e CTAs.
- `src/features/history/history.module.css` — composição editorial e estados de `/historia`.
- `src/app/historia/page.tsx`, `page.test.tsx`, `loading.tsx`, `error.tsx`, `route-states.test.tsx` — nova rota pública completa.

### Modificar

- `src/app/home/page.tsx`, `page.test.tsx` — substituir redirecionamento pela landing Server Component.
- `src/app/membros/page.tsx`, `page.test.tsx` — redirecionamento permanente de compatibilidade.
- `src/components/shell/AppHeader.tsx`, `AppHeader.test.tsx`, `AppFooter.tsx` — marca para `/home` e navegação “História”.
- `src/app/page.tsx`, `page.destination.test.ts` — trocar somente `/registros` por `/home` no fim da descida.
- `src/app/globals.css` — alinhar o frame desktop ao piso documentado de 1024 px.

### Remover

- `src/app/membros/loading.tsx`, `error.tsx`, `route-states.test.tsx` — esses estados passam a pertencer a `/historia`; `/membros` só redireciona.

---

### Task 1: Conteúdo canônico e seleção dos restaurantes recentes

**Files:**
- Create: `src/content/crater-history.ts`
- Create: `src/features/home/select-recent-restaurants.ts`
- Test: `src/features/home/select-recent-restaurants.test.ts`

**Interfaces:**
- Produces: `CRATER_HISTORY` com `{ title, excerpt, chapters }`.
- Produces: `selectRecentRestaurants(records: readonly PublicVisitSummary[], limit?: number): PublicVisitSummary[]`.
- Produces: `HOME_RECENT_RESTAURANT_LIMIT = 6`.

- [ ] **Step 1: Escrever o teste falhando da seleção pura**

```ts
import { describe, expect, it } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import {
  HOME_RECENT_RESTAURANT_LIMIT,
  selectRecentRestaurants,
} from './select-recent-restaurants';

function visit(id: string, restaurantSlug: string): PublicVisitSummary {
  return {
    id,
    slug: `visita-${id}`,
    restaurant: {
      slug: restaurantSlug,
      name: restaurantSlug,
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

describe('selectRecentRestaurants', () => {
  it('preserva a ordem do repositório, mantém a visita mais recente de cada restaurante e não muta a entrada', () => {
    const records = [visit('1', 'a'), visit('2', 'a'), visit('3', 'b')];
    const snapshot = [...records];

    expect(selectRecentRestaurants(records).map((record) => record.id)).toEqual(['1', '3']);
    expect(records).toEqual(snapshot);
  });

  it('limita a seleção ao máximo editorial de seis restaurantes', () => {
    const records = Array.from({ length: 8 }, (_, index) => visit(String(index), `r-${index}`));

    expect(HOME_RECENT_RESTAURANT_LIMIT).toBe(6);
    expect(selectRecentRestaurants(records)).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm test -- src/features/home/select-recent-restaurants.test.ts`

Expected: FAIL porque `./select-recent-restaurants` ainda não existe.

- [ ] **Step 3: Implementar a seleção mínima**

```ts
import type { PublicVisitSummary } from '@/domain/reviews/repository';

export const HOME_RECENT_RESTAURANT_LIMIT = 6;

export function selectRecentRestaurants(
  records: readonly PublicVisitSummary[],
  limit = HOME_RECENT_RESTAURANT_LIMIT,
): PublicVisitSummary[] {
  const selected: PublicVisitSummary[] = [];
  const seenRestaurants = new Set<string>();

  for (const record of records) {
    if (seenRestaurants.has(record.restaurant.slug)) continue;
    seenRestaurants.add(record.restaurant.slug);
    selected.push(record);
    if (selected.length === limit) break;
  }

  return selected;
}
```

- [ ] **Step 4: Criar o conteúdo canônico tipado**

```ts
export const CRATER_HISTORY = {
  title: 'A cratera nos encontrou primeiro.',
  excerpt: 'Descoberta por Lucas ao lado do restaurante que sempre nos faz voltar, a cratera transformou amigos em Discípulos, avaliações em registros e mosquitos em patrimônio natural.',
  chapters: [
    {
      id: 'descoberta',
      eyebrow: 'Capítulo I',
      title: 'A descoberta',
      body: 'Antes dos registros, já existia um restaurante muito bom. Ao lado dele, por nenhum motivo aparente, existia uma cratera enorme. Lucas foi o primeiro a reconhecer a descoberta e a compreender que aquele vazio não poderia continuar sem testemunhas.',
    },
    {
      id: 'peregrinacao',
      eyebrow: 'Capítulo II',
      title: 'A peregrinação',
      body: 'O restaurante era bom demais para uma visita única. O grupo voltou, depois voltou outra vez, e cada jantar tornou o caminho até a cratera mais familiar. O que era costume ganhou a solenidade de uma peregrinação.',
    },
    {
      id: 'sociedade',
      eyebrow: 'Capítulo III',
      title: 'A sociedade',
      body: 'Os frequentadores tornaram-se Discípulos da Cratera. Sob a presença do Monarca Guizão, passaram a conservar a memória de cada mesa: as notas individuais, os pratos pedidos e os comentários que, juntos, formam cada registro coletivo.',
    },
    {
      id: 'patrimonio',
      eyebrow: 'Capítulo IV',
      title: 'Patrimônio natural',
      body: 'A grandeza da cratera não é apenas espiritual ou gastronômica. Sua geografia oferece uma forma excepcional de conservação da abundante fauna local de mosquitos, patrimônio vivo que acompanha silenciosamente as reuniões da Sociedade.',
    },
  ],
} as const;
```

- [ ] **Step 5: Executar o teste e confirmar sucesso**

Run: `npm test -- src/features/home/select-recent-restaurants.test.ts`

Expected: 2 tests PASS.

- [ ] **Step 6: Commitar a entrega**

```powershell
git add -- src/content/crater-history.ts src/features/home/select-recent-restaurants.ts src/features/home/select-recent-restaurants.test.ts
git commit -m "feat: define crater landing content"
```

---

### Task 2: Carrossel acessível de restaurantes recentes

**Files:**
- Create: `src/features/home/RecentRestaurantsCarousel.tsx`
- Create: `src/features/home/RecentRestaurantsCarousel.test.tsx`
- Create: `src/features/home/home.module.css`

**Interfaces:**
- Consumes: `PublicVisitSummary[]`, `formatVisitDate`, `formatParticipation`, `formatScore`.
- Produces: `RecentRestaurantsCarousel({ records }: { records: readonly PublicVisitSummary[] })`.
- Behavior: índice começa em zero, setas e indicadores mudam o item ativo, `ArrowLeft`/`ArrowRight` funcionam quando a região está focada, controles das extremidades ficam desabilitados, não há autoplay.

- [ ] **Step 1: Escrever os testes falhando do carrossel**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecentRestaurantsCarousel } from './RecentRestaurantsCarousel';

afterEach(cleanup);

function record(id: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: `restaurante-${id}`,
      name,
      cuisine: 'Italiana',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      address: null,
      priceBand: '$$',
    },
    visitedAt: '2026-08-30',
    publishedAt: '2026-08-31T12:00:00.000Z',
    coverPhotoUrl: null,
    participantCount: 6,
    averages: null,
    overall: 8.3,
  };
}

describe('RecentRestaurantsCarousel', () => {
  it('navega por botões, teclado e indicadores sem ultrapassar as extremidades', async () => {
    const user = userEvent.setup();
    render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B'), record('3', 'C')]} />);

    const region = screen.getByRole('region', { name: 'Restaurantes publicados recentemente' });
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurante anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));
    expect(screen.getByRole('heading', { name: 'B' })).toBeInTheDocument();

    region.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo restaurante' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' }));
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' }))
      .toHaveAttribute('aria-current', 'true');
  });

  it('mostra estado vazio honesto sem fabricar slides', () => {
    render(<RecentRestaurantsCarousel records={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Os registros ainda estão em silêncio');
    expect(screen.getByRole('link', { name: 'Consultar o livro de registros' }))
      .toHaveAttribute('href', '/registros');
    expect(screen.queryByRole('button', { name: 'Próximo restaurante' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm test -- src/features/home/RecentRestaurantsCarousel.test.tsx`

Expected: FAIL porque o componente ainda não existe.

- [ ] **Step 3: Implementar estado, teclado e contrato acessível**

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import {
  formatParticipation,
  formatScore,
  formatVisitDate,
} from '@/features/restaurant/restaurant-formatters';
import styles from './home.module.css';

export interface RecentRestaurantsCarouselProps {
  records: readonly PublicVisitSummary[];
}

export function RecentRestaurantsCarousel({ records }: RecentRestaurantsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (records.length === 0) {
    return (
      <div className={styles.carouselEmpty} role="status">
        <span aria-hidden="true">C</span>
        <h3>Os registros ainda estão em silêncio</h3>
        <p>Quando uma mesa for publicada, ela aparecerá primeiro nesta página.</p>
        <Link href="/registros">Consultar o livro de registros</Link>
      </div>
    );
  }

  const record = records[activeIndex];
  const previous = records[activeIndex - 1] ?? null;
  const next = records[activeIndex + 1] ?? null;

  function moveTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(records.length - 1, index)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <div
      aria-label="Restaurantes publicados recentemente"
      aria-roledescription="carrossel"
      className={styles.carousel}
      onKeyDown={handleKeyDown}
      role="region"
      tabIndex={0}
    >
      <div className={styles.carouselStage}>
        <div aria-hidden="true" className={styles.adjacentSlide}>
          {previous ? <span>{previous.restaurant.name}</span> : null}
        </div>

        <article className={styles.activeSlide} aria-label={`Registro de ${record.restaurant.name}`}>
          <div className={styles.activeImage}>
            {record.coverPhotoUrl ? (
              <Image
                alt={`Foto de ${record.restaurant.name} no registro dos Crateristas`}
                fill
                sizes="(max-width: 1440px) 68vw, 980px"
                src={record.coverPhotoUrl}
              />
            ) : (
              <div className={styles.archiveFallback}>
                <span aria-hidden="true">C</span>
                <p>Registro sem fotografia</p>
              </div>
            )}
          </div>
          <div className={styles.activeCopy}>
            <p className={styles.restaurantMeta}>
              {record.restaurant.cuisine} · {record.restaurant.neighborhood}, {record.restaurant.city}
            </p>
            <h3>{record.restaurant.name}</h3>
            <p>Visita em <time dateTime={record.visitedAt}>{formatVisitDate(record.visitedAt)}</time></p>
            <p>{formatParticipation(record.participantCount)}</p>
            <p className={styles.collectiveScore}>Nota coletiva <strong>{formatScore(record.overall)}</strong></p>
            <Link href={`/restaurantes/${record.slug}`}>Abrir registro</Link>
          </div>
        </article>

        <div aria-hidden="true" className={styles.adjacentSlide}>
          {next ? <span>{next.restaurant.name}</span> : null}
        </div>
      </div>

      <div className={styles.carouselControls}>
        <button
          aria-label="Restaurante anterior"
          disabled={activeIndex === 0}
          onClick={() => moveTo(activeIndex - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <p aria-live="polite">Registro {activeIndex + 1} de {records.length} — {record.restaurant.name}</p>
        <button
          aria-label="Próximo restaurante"
          disabled={activeIndex === records.length - 1}
          onClick={() => moveTo(activeIndex + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className={styles.carouselDots} aria-label="Escolher restaurante">
        {records.map((candidate, index) => (
          <button
            aria-current={index === activeIndex ? 'true' : undefined}
            aria-label={`Mostrar restaurante ${index + 1}: ${candidate.restaurant.name}`}
            key={candidate.id}
            onClick={() => moveTo(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar os estilos completos do carrossel em `home.module.css`**

```css
.carousel {
  outline: none;
}

.carouselStage {
  display: grid;
  grid-template-columns: minmax(96px, 0.16fr) minmax(0, 0.68fr) minmax(96px, 0.16fr);
  align-items: center;
  gap: 24px;
  min-height: 560px;
  overflow: hidden;
}

.adjacentSlide {
  min-height: 370px;
  display: grid;
  place-items: end center;
  padding: 24px 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-muted);
  writing-mode: vertical-rl;
}

.activeSlide {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--surface);
}

.activeImage {
  position: relative;
  min-height: 520px;
  background: var(--surface-raised);
}

.activeImage img {
  object-fit: cover;
}

.archiveFallback,
.carouselEmpty {
  display: grid;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.archiveFallback {
  height: 100%;
  color: var(--ink-muted);
}

.archiveFallback span,
.carouselEmpty > span {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
  border: 1px solid var(--ember);
  border-radius: 50%;
  color: var(--ember-bright);
  font-family: var(--font-editorial), Georgia, serif;
  font-size: 1.7rem;
}

.activeCopy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 44px;
}

.restaurantMeta {
  color: var(--ember-bright);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.activeCopy h3 {
  margin-top: 18px;
  color: var(--ink);
  font-size: clamp(2.2rem, 3vw, 3.8rem);
  font-weight: 560;
  letter-spacing: -0.04em;
  line-height: 0.98;
}

.activeCopy h3 + p {
  margin-top: 28px;
}

.activeCopy p:not(.restaurantMeta, .collectiveScore) {
  color: var(--ink-muted);
  font-size: 0.86rem;
}

.collectiveScore {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
  color: var(--ink-muted);
}

.collectiveScore strong {
  color: var(--ink);
  font-family: var(--font-editorial), Georgia, serif;
  font-size: 2.4rem;
  font-weight: 560;
}

.activeCopy a,
.carouselEmpty a {
  width: fit-content;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  margin-top: 28px;
  padding: 0 20px;
  border: 1px solid var(--ember);
  background: var(--ember);
  color: var(--canvas);
  font-size: 0.8rem;
  font-weight: 800;
}

.carouselControls {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 18px;
  max-width: 760px;
  margin: 24px auto 0;
}

.carouselControls p {
  color: var(--ink-muted);
  font-size: 0.78rem;
  text-align: center;
}

.carouselControls button {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.carouselControls button:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.carouselDots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.carouselDots button {
  width: 28px;
  height: 3px;
  border: 0;
  background: var(--line);
  cursor: pointer;
}

.carouselDots button[aria-current='true'] {
  background: var(--ember-bright);
}

.carouselEmpty {
  min-height: 420px;
  padding: 56px;
  border: 1px solid var(--line);
  background: var(--surface);
}

.carouselEmpty h3 {
  font-size: 2rem;
  font-weight: 560;
}

.carouselEmpty p {
  max-width: 520px;
  margin-top: 12px;
  color: var(--ink-muted);
}
```

- [ ] **Step 5: Executar os testes e confirmar sucesso**

Run: `npm test -- src/features/home/RecentRestaurantsCarousel.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Commitar a entrega**

```powershell
git add -- src/features/home/RecentRestaurantsCarousel.tsx src/features/home/RecentRestaurantsCarousel.test.tsx src/features/home/home.module.css
git commit -m "feat: add recent restaurant carousel"
```

---

### Task 3: Indicador de profundidade e seções reutilizáveis da landing

**Files:**
- Create: `src/features/home/DepthIndicator.tsx`
- Create: `src/features/home/DepthIndicator.test.tsx`
- Create: `src/features/home/LandingHero.tsx`
- Create: `src/features/home/HistoryPreview.tsx`
- Create: `src/features/home/MembersPreview.tsx`
- Modify: `src/features/home/home.module.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `DepthSection = { id: string; label: string }` e `DepthIndicator({ sections })`.
- Produces: `LandingHero()` com raiz `id="entrada"`.
- Produces: `HistoryPreview()` com raiz `id="historia"`.
- Produces: `MembersPreview({ members }: { members: readonly PublicMemberSummary[] })` com raiz `id="sociedade"` e no máximo oito perfis.

- [ ] **Step 1: Escrever o teste falhando do indicador**

```tsx
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DepthIndicator } from './DepthIndicator';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('DepthIndicator', () => {
  it('liga cada camada à seção e acompanha a entrada observada', () => {
    let notify: IntersectionObserverCallback = () => undefined;
    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '0px';
      thresholds = [0.45];
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub);
    document.body.innerHTML = '<section id="entrada"></section><section id="historia"></section>';

    render(<DepthIndicator sections={[{ id: 'entrada', label: 'Entrada' }, { id: 'historia', label: 'História' }]} />);
    expect(screen.getByRole('link', { name: 'Entrada' })).toHaveAttribute('aria-current', 'location');

    act(() => notify(
      [{ isIntersecting: true, target: document.querySelector('#historia') } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ));
    expect(screen.getByRole('link', { name: 'História' })).toHaveAttribute('aria-current', 'location');
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm test -- src/features/home/DepthIndicator.test.tsx`

Expected: FAIL porque `DepthIndicator` ainda não existe.

- [ ] **Step 3: Implementar o indicador com `IntersectionObserver`**

```tsx
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
      <span className={styles.depthRule} aria-hidden="true" />
      {sections.map((section, index) => (
        <a
          aria-current={activeId === section.id ? 'location' : undefined}
          href={`#${section.id}`}
          key={section.id}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          {section.label}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Implementar `LandingHero`, `HistoryPreview` e `MembersPreview`**

```tsx
// LandingHero.tsx
import Link from 'next/link';
import styles from './home.module.css';

export function LandingHero() {
  return (
    <section className={styles.hero} id="entrada" aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Livro de registros · Entrada pública</p>
        <h1 id="home-title">Bem-vindo à cratera</h1>
        <p className={styles.heroLead}>Uma sociedade reunida à mesa, oito notas por visita e um buraco que continua sem explicação.</p>
        <Link className={styles.primaryAction} href="/registros">Explorar restaurantes</Link>
      </div>
      <div aria-hidden="true" className={styles.craterContour}><span>C</span></div>
    </section>
  );
}
```

```tsx
// HistoryPreview.tsx
import Link from 'next/link';
import { CRATER_HISTORY } from '@/content/crater-history';
import styles from './home.module.css';

export function HistoryPreview() {
  return (
    <section className={styles.historyPreview} id="historia" aria-labelledby="history-preview-title">
      <p className={styles.marginNote}>Arquivo oral · fragmento 01</p>
      <div>
        <p className={styles.eyebrow}>A origem da sociedade</p>
        <h2 id="history-preview-title">{CRATER_HISTORY.title}</h2>
        <p className={styles.historyExcerpt}>{CRATER_HISTORY.excerpt}</p>
        <Link className={styles.textAction} href="/historia">Conheça nossa história</Link>
      </div>
    </section>
  );
}
```

```tsx
// MembersPreview.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { getTrustedMemberAvatarUrl } from '@/features/members/member-avatar';
import styles from './home.module.css';

export function MembersPreview({ members }: { members: readonly PublicMemberSummary[] }) {
  const visibleMembers = members.slice(0, 8);
  return (
    <section className={styles.membersPreview} id="sociedade" aria-labelledby="members-preview-title">
      <header className={styles.sectionHeader}>
        <div><p className={styles.eyebrow}>Os nomes à margem</p><h2 id="members-preview-title">Os oito Crateristas</h2></div>
        <Link className={styles.textAction} href="/historia#integrantes">Conheça os integrantes</Link>
      </header>
      {visibleMembers.length === 0 ? (
        <div className={styles.membersEmpty} role="status">O diretório da Sociedade ainda está em preparação.</div>
      ) : (
        <div className={styles.memberConstellation} role="list" aria-label="Prévia dos integrantes">
          {visibleMembers.map((member) => {
            const avatarUrl = getTrustedMemberAvatarUrl(member.avatarUrl);
            return (
              <article className={styles.memberPortrait} key={member.slug} role="listitem">
                <div className={styles.portraitFrame}>
                  {avatarUrl ? <Image alt={`Retrato de ${member.displayName}`} fill sizes="180px" src={avatarUrl} /> : <span aria-hidden="true">{String(member.memberNumber).padStart(2, '0')}</span>}
                </div>
                <p>Craterista nº {String(member.memberNumber).padStart(2, '0')}</p>
                <h3>{member.displayName}</h3>
                {member.societyTitle ? <span>{member.societyTitle}</span> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Acrescentar ao `home.module.css` a composição exata das novas seções**

Adicionar as classes usadas acima com estas regras estruturais:

```css
.landing { position: relative; overflow: clip; background: var(--canvas); }
.landingSection, .hero, .historyPreview, .membersPreview { width: min(calc(100% - 160px), var(--page-max)); margin: 0 auto; }
.hero { min-height: calc(100vh - 88px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(420px, 0.72fr); align-items: center; gap: 80px; padding: 80px 0 104px; }
.heroCopy { max-width: 840px; }
.eyebrow { color: var(--ember-bright); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
.hero h1 { margin-top: 18px; max-width: 820px; color: var(--ink); font-size: clamp(5.4rem, 8vw, 8.7rem); font-weight: 520; letter-spacing: -0.065em; line-height: 0.82; }
.heroLead { max-width: 620px; margin-top: 34px; color: var(--ink-muted); font-family: var(--font-editorial), Georgia, serif; font-size: 1.35rem; line-height: 1.55; }
.primaryAction { min-height: 50px; display: inline-flex; align-items: center; margin-top: 36px; padding: 0 24px; border: 1px solid var(--ember); background: var(--ember); color: var(--canvas); font-size: 0.84rem; font-weight: 800; }
.craterContour { aspect-ratio: 1; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; box-shadow: inset 0 0 0 52px var(--surface), inset 0 0 0 53px var(--line), inset 0 0 0 112px var(--canvas), inset 0 0 0 113px var(--line); transform: rotate(-7deg); }
.craterContour span { color: var(--ember-bright); font-family: var(--font-editorial), Georgia, serif; font-size: 6rem; }
.historyPreview { min-height: 760px; display: grid; grid-template-columns: 220px minmax(0, 860px); align-items: center; justify-content: center; gap: 70px; padding: 128px 0; background: var(--surface); box-shadow: 0 0 0 100vmax var(--surface); clip-path: inset(0 -100vmax); }
.marginNote { align-self: start; margin-top: 110px; color: var(--ink-muted); font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; writing-mode: vertical-rl; }
.historyPreview h2, .sectionHeader h2 { margin-top: 16px; color: var(--ink); font-size: clamp(3.6rem, 5vw, 6.2rem); font-weight: 540; letter-spacing: -0.05em; line-height: 0.94; }
.historyExcerpt { margin-top: 30px; color: var(--ink-muted); font-family: var(--font-editorial), Georgia, serif; font-size: 1.45rem; line-height: 1.65; }
.textAction { width: fit-content; display: inline-flex; margin-top: 30px; padding-bottom: 7px; border-bottom: 1px solid var(--ember); color: var(--ink); font-size: 0.82rem; font-weight: 800; }
.membersPreview { padding: 132px 0 150px; }
.sectionHeader { display: flex; align-items: end; justify-content: space-between; gap: 60px; }
.memberConstellation { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 48px 26px; margin-top: 64px; }
.memberPortrait:nth-child(even) { transform: translateY(42px); }
.portraitFrame { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border: 1px solid var(--line); background: var(--surface); }
.portraitFrame img { object-fit: cover; }
.portraitFrame span { height: 100%; display: grid; place-items: center; color: var(--ember-bright); font-family: var(--font-editorial), Georgia, serif; font-size: 3rem; }
.memberPortrait > p { margin-top: 18px; color: var(--ember-bright); font-size: 0.65rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
.memberPortrait h3 { margin-top: 6px; color: var(--ink); font-size: 1.55rem; font-weight: 560; }
.memberPortrait > span { display: block; margin-top: 6px; color: var(--ink-muted); font-family: var(--font-editorial), Georgia, serif; font-size: 0.85rem; }
.membersEmpty { min-height: 280px; display: grid; place-items: center; margin-top: 48px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-muted); }
.depthIndicator { position: fixed; top: 50%; right: 28px; z-index: 20; display: grid; gap: 14px; transform: translateY(-50%); }
.depthIndicator a { display: grid; grid-template-columns: 24px 1fr; gap: 8px; color: var(--ink-muted); font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase; }
.depthIndicator a[aria-current='location'] { color: var(--ember-bright); }
.depthRule { position: absolute; top: 0; bottom: 0; left: 10px; z-index: -1; width: 1px; background: var(--line); }
.routeState { min-height: 680px; display: grid; place-content: center; justify-items: center; padding: 80px; text-align: center; }
.routeState h1 { margin-top: 14px; font-size: 3rem; font-weight: 560; }
.routeState p:last-of-type { max-width: 540px; margin-top: 14px; color: var(--ink-muted); }
.routeState button { min-height: 44px; margin-top: 24px; padding: 0 20px; border: 1px solid var(--ember); background: var(--ember); color: var(--canvas); font-weight: 800; cursor: pointer; }
@media (max-width: 1280px) { .hero, .landingSection, .historyPreview, .membersPreview { width: min(calc(100% - 96px), var(--page-max)); } .hero { gap: 48px; } .depthIndicator { display: none; } }
@media (prefers-reduced-motion: reduce) { .memberPortrait:nth-child(even) { transform: none; } .primaryAction, .textAction, .carouselControls button, .carouselDots button { transition: none; } }
```

Em `src/app/globals.css`, manter todas as demais regras e trocar somente o piso do frame:

```css
.desktop-frame {
  min-width: 1024px;
  min-height: 100vh;
  background: var(--canvas);
}
```

- [ ] **Step 6: Executar o teste e confirmar sucesso**

Run: `npm test -- src/features/home/DepthIndicator.test.tsx`

Expected: 1 test PASS.

- [ ] **Step 7: Commitar a entrega**

```powershell
git add -- src/features/home/DepthIndicator.tsx src/features/home/DepthIndicator.test.tsx src/features/home/LandingHero.tsx src/features/home/HistoryPreview.tsx src/features/home/MembersPreview.tsx src/features/home/home.module.css src/app/globals.css
git commit -m "feat: compose crater landing sections"
```

---

### Task 4: Integrar a nova `/home` aos dados públicos

**Files:**
- Modify: `src/app/home/page.tsx`
- Modify: `src/app/home/page.test.tsx`
- Create: `src/app/home/loading.tsx`
- Create: `src/app/home/error.tsx`
- Create: `src/app/home/route-states.test.tsx`
- Modify: `src/features/home/home.module.css`

**Interfaces:**
- Consumes: `repository.listPublicVisits({})`, `repository.listPublicMembers()`, `findOptionalMember()` em `Promise.all`.
- Consumes: componentes dos Tasks 1–3.
- Produces: `HomePage(): Promise<ReactElement>` e `dynamic = 'force-dynamic'`.

- [ ] **Step 1: Substituir o antigo teste de redirecionamento por testes falhando da landing**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MemberRecord,
  PublicMemberSummary,
  PublicVisitSummary,
} from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  listPublicMembers: vi.fn(),
  listPublicVisits: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({
  findOptionalMember: dependencies.findOptionalMember,
}));
vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({
    listPublicMembers: dependencies.listPublicMembers,
    listPublicVisits: dependencies.listPublicVisits,
  }),
}));

import HomePage from './page';

afterEach(cleanup);

function record(id: string, restaurantSlug: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: restaurantSlug,
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

const recordA = record('1', 'a', 'A');
const duplicateA = record('2', 'a', 'A');
const recordB = record('3', 'b', 'B');
const records = [recordA, duplicateA, recordB];
const publicMember: PublicMemberSummary = {
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Coleciona relatos de mesas memoráveis.',
  favoriteCuisine: 'Brasileira',
  contributions: { publishedVisits: 7, scorecards: 7 },
};
const members = [publicMember];
const viewer: MemberRecord = {
  id: 'member-private-canary',
  authUserId: 'auth-user-private-canary',
  email: 'privado@example.com',
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Não deve ser lida deste objeto.',
  favoriteCuisine: 'Não deve ser lida deste objeto.',
  role: 'admin',
};

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.listPublicVisits.mockResolvedValue(records);
  dependencies.listPublicMembers.mockResolvedValue(members);
  dependencies.findOptionalMember.mockResolvedValue(null);
});

describe('/home', () => {
it('inicia as três consultas em paralelo e renderiza a experiência pública', async () => {
  let releaseRecords: (value: PublicVisitSummary[]) => void = () => undefined;
  let releaseMembers: (value: PublicMemberSummary[]) => void = () => undefined;
  let releaseViewer: (value: MemberRecord | null) => void = () => undefined;
  dependencies.listPublicVisits.mockReturnValue(new Promise((resolve) => { releaseRecords = resolve; }));
  dependencies.listPublicMembers.mockReturnValue(new Promise((resolve) => { releaseMembers = resolve; }));
  dependencies.findOptionalMember.mockReturnValue(new Promise((resolve) => { releaseViewer = resolve; }));

  const pagePromise = HomePage();
  expect(dependencies.listPublicVisits).toHaveBeenCalledWith({});
  expect(dependencies.listPublicMembers).toHaveBeenCalledOnce();
  expect(dependencies.findOptionalMember).toHaveBeenCalledOnce();
  releaseRecords(records);
  releaseMembers(members);
  releaseViewer(null);
  render(await pagePromise);

  expect(screen.getByRole('heading', { name: 'Bem-vindo à cratera' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Explorar restaurantes' })).toHaveAttribute('href', '/registros');
  expect(screen.getByRole('heading', { name: 'Restaurantes mais recentes' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'A cratera nos encontrou primeiro.' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Os oito Crateristas' })).toBeInTheDocument();
});

it('seleciona restaurantes únicos e adapta o encerramento ao membro', async () => {
  dependencies.listPublicVisits.mockResolvedValue([recordA, duplicateA, recordB]);
  dependencies.findOptionalMember.mockResolvedValue(viewer);
  render(await HomePage());

  expect(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /restaurante 2: A/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Abrir seu painel' })).toHaveAttribute('href', '/painel');
  expect(document.body).not.toHaveTextContent(/privado@example\.com|auth-user-private-canary/);
});
});
```

- [ ] **Step 2: Criar testes falhando dos estados de rota**

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeError from './error';
import HomeLoading from './loading';

afterEach(cleanup);

describe('estados da home pública', () => {
it('mantém o shell público enquanto prepara a entrada', () => {
  render(<HomeLoading />);
  expect(screen.getByRole('status')).toHaveTextContent('Preparando a entrada');
  expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
});

it('oferece nova tentativa sem expor a falha interna', () => {
  const reset = vi.fn();
  render(<HomeError error={new Error('segredo interno')} reset={reset} />);
  expect(screen.getByRole('heading', { name: 'Não foi possível abrir a cratera agora.' })).toBeInTheDocument();
  expect(screen.queryByText('segredo interno')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(reset).toHaveBeenCalledOnce();
});
});
```

- [ ] **Step 3: Executar os testes e confirmar a falha esperada**

Run: `npm test -- src/app/home/page.test.tsx src/app/home/route-states.test.tsx`

Expected: FAIL porque a página ainda redireciona e os estados não existem.

- [ ] **Step 4: Implementar `HomePage`**

```tsx
import Link from 'next/link';
import { PublicShell } from '@/components/shell/PublicShell';
import { DepthIndicator, type DepthSection } from '@/features/home/DepthIndicator';
import { HistoryPreview } from '@/features/home/HistoryPreview';
import { LandingHero } from '@/features/home/LandingHero';
import { MembersPreview } from '@/features/home/MembersPreview';
import { RecentRestaurantsCarousel } from '@/features/home/RecentRestaurantsCarousel';
import { selectRecentRestaurants } from '@/features/home/select-recent-restaurants';
import styles from '@/features/home/home.module.css';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

const DEPTH_SECTIONS: readonly DepthSection[] = [
  { id: 'entrada', label: 'Entrada' },
  { id: 'restaurantes', label: 'Registros' },
  { id: 'historia', label: 'História' },
  { id: 'sociedade', label: 'Sociedade' },
];

export default async function HomePage() {
  const repository = getReviewRepository();
  const [records, members, viewer] = await Promise.all([
    repository.listPublicVisits({}),
    repository.listPublicMembers(),
    findOptionalMember(),
  ]);
  const recentRestaurants = selectRecentRestaurants(records);

  return (
    <PublicShell viewer={viewer ? 'member' : 'visitor'}>
      <div className={styles.landing}>
        <DepthIndicator sections={DEPTH_SECTIONS} />
        <LandingHero />
        <section className={styles.landingSection} id="restaurantes" aria-labelledby="recent-title">
          <header className={styles.sectionHeader}>
            <div><p className={styles.eyebrow}>Últimas páginas publicadas</p><h2 id="recent-title">Restaurantes mais recentes</h2></div>
            <Link className={styles.textAction} href="/registros">Ver todos os registros</Link>
          </header>
          <RecentRestaurantsCarousel records={recentRestaurants} />
        </section>
        <HistoryPreview />
        <MembersPreview members={members} />
        <section className={styles.closingCallout} aria-labelledby="closing-title">
          <p className={styles.eyebrow}>O livro continua</p>
          <h2 id="closing-title">A próxima mesa ainda não foi registrada.</h2>
          <div>
            <Link className={styles.primaryAction} href="/registros">Explorar o arquivo</Link>
            <Link className={styles.textAction} href={viewer ? '/painel' : '/entrar'}>{viewer ? 'Abrir seu painel' : 'Entrar como integrante'}</Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
```

- [ ] **Step 5: Implementar loading e error sem transformar falha em estado vazio**

```tsx
// src/app/home/loading.tsx
import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/home/home.module.css';

export default function HomeLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Entrada pública</p>
        <h1>Preparando a entrada...</h1>
        <p>Os registros e integrantes da Sociedade estão sendo reunidos.</p>
      </div>
    </PublicShell>
  );
}
```

```tsx
// src/app/home/error.tsx
'use client';

import styles from '@/features/home/home.module.css';

interface HomeErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HomeError({ reset }: HomeErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Entrada indisponível</p>
        <h1>Não foi possível abrir a cratera agora.</h1>
        <p>Tente novamente para consultar a página pública da Sociedade.</p>
        <button onClick={reset} type="button">Tentar novamente</button>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Completar os estilos da seção de registros e encerramento**

```css
.landingSection { padding: 120px 0 140px; }
.landingSection .sectionHeader { margin-bottom: 46px; }
.landingSection .sectionHeader h2 { font-size: clamp(3.4rem, 4.5vw, 5.6rem); }
.closingCallout { width: min(calc(100% - 160px), var(--page-max)); min-height: 560px; display: grid; place-content: center; justify-items: center; margin: 0 auto; padding: 120px 80px; border-top: 1px solid var(--line); text-align: center; }
.closingCallout h2 { max-width: 900px; margin-top: 16px; color: var(--ink); font-size: clamp(3.2rem, 5vw, 6rem); font-weight: 540; letter-spacing: -0.05em; line-height: 0.95; }
.closingCallout > div { display: flex; align-items: center; gap: 28px; margin-top: 36px; }
.closingCallout .primaryAction, .closingCallout .textAction { margin-top: 0; }
@media (max-width: 1280px) { .closingCallout { width: min(calc(100% - 96px), var(--page-max)); } }
```

- [ ] **Step 7: Executar os testes e confirmar sucesso**

Run: `npm test -- src/app/home/page.test.tsx src/app/home/route-states.test.tsx src/features/home`

Expected: todos os testes de home PASS.

- [ ] **Step 8: Commitar a entrega**

```powershell
git add -- src/app/home src/features/home/home.module.css
git commit -m "feat: replace home redirect with public landing"
```

---

### Task 5: Criar `/historia` e preservar `/membros` por redirecionamento

**Files:**
- Create: `src/features/history/HistoryNarrative.tsx`
- Create: `src/features/history/history.module.css`
- Create: `src/app/historia/page.tsx`
- Create: `src/app/historia/page.test.tsx`
- Create: `src/app/historia/loading.tsx`
- Create: `src/app/historia/error.tsx`
- Create: `src/app/historia/route-states.test.tsx`
- Modify: `src/app/membros/page.tsx`
- Modify: `src/app/membros/page.test.tsx`
- Delete: `src/app/membros/loading.tsx`
- Delete: `src/app/membros/error.tsx`
- Delete: `src/app/membros/route-states.test.tsx`

**Interfaces:**
- Produces: `HistoryNarrative({ members, showPanelLink })`.
- Produces: `/historia` Server Component que consulta membros e viewer em paralelo.
- Produces: `/membros` chamando `permanentRedirect('/historia#integrantes')`.

- [ ] **Step 1: Escrever o teste falhando da página de história**

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord, PublicMemberSummary } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  listPublicMembers: vi.fn(),
}));
vi.mock('@/lib/auth/access', () => ({ findOptionalMember: dependencies.findOptionalMember }));
vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({ listPublicMembers: dependencies.listPublicMembers }),
}));

import HistoryPage from './page';

afterEach(cleanup);

const publicMember: PublicMemberSummary = {
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Coleciona relatos de mesas memoráveis.',
  favoriteCuisine: 'Brasileira',
  contributions: { publishedVisits: 7, scorecards: 7 },
};
const viewer: MemberRecord = {
  id: 'member-private-canary',
  authUserId: 'auth-user-private-canary',
  email: 'privado@example.com',
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Não deve ser lida deste objeto.',
  favoriteCuisine: 'Não deve ser lida deste objeto.',
  role: 'admin',
};

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.listPublicMembers.mockResolvedValue([publicMember]);
  dependencies.findOptionalMember.mockResolvedValue(null);
});

describe('/historia', () => {
it('consulta integrantes e sessão em paralelo e renderiza os quatro capítulos', async () => {
  let releaseMembers: (value: PublicMemberSummary[]) => void = () => undefined;
  let releaseViewer: (value: MemberRecord | null) => void = () => undefined;
  dependencies.listPublicMembers.mockReturnValue(new Promise((resolve) => { releaseMembers = resolve; }));
  dependencies.findOptionalMember.mockReturnValue(new Promise((resolve) => { releaseViewer = resolve; }));

  const pagePromise = HistoryPage();
  expect(dependencies.listPublicMembers).toHaveBeenCalledOnce();
  expect(dependencies.findOptionalMember).toHaveBeenCalledOnce();
  releaseMembers([publicMember]);
  releaseViewer(null);
  render(await pagePromise);

  expect(screen.getByRole('heading', { name: 'A cratera nos encontrou primeiro.' })).toBeInTheDocument();
  for (const title of ['A descoberta', 'A peregrinação', 'A sociedade', 'Patrimônio natural']) {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  }
  expect(screen.getByRole('heading', { name: 'Os oito Crateristas' })).toBeInTheDocument();
  expect(screen.getByRole('article', { name: 'Craterista nº 01: Ana Souza' })).toBeInTheDocument();
});

it('mostra o painel apenas ao membro sem vazar seu registro privado', async () => {
  dependencies.findOptionalMember.mockResolvedValue(viewer);
  render(await HistoryPage());
  expect(screen.getByRole('link', { name: 'Suas avaliações pendentes' })).toHaveAttribute('href', '/painel');
  expect(document.body).not.toHaveTextContent(/privado@example\.com|auth-user-private-canary|member-private-canary/);
});
});
```

- [ ] **Step 2: Reescrever o teste de `/membros` para o redirecionamento permanente**

```tsx
import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  permanentRedirect: vi.fn(() => { throw new Error('NEXT_PERMANENT_REDIRECT_TEST'); }),
}));
vi.mock('next/navigation', () => ({ permanentRedirect: dependencies.permanentRedirect }));
import MembersRedirect from './page';

describe('/membros', () => {
it('preserva bookmarks enviando membros aos integrantes da história', () => {
  expect(() => MembersRedirect()).toThrow('NEXT_PERMANENT_REDIRECT_TEST');
  expect(dependencies.permanentRedirect).toHaveBeenCalledWith('/historia#integrantes');
});
});
```

- [ ] **Step 3: Criar os testes falhando de loading e error de `/historia`**

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryError from './error';
import HistoryLoading from './loading';

afterEach(cleanup);

describe('estados da rota de história', () => {
  it('mantém o shell público enquanto prepara a narrativa', () => {
    render(<HistoryLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Consultando a história');
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('oferece nova tentativa sem expor a falha interna', () => {
    const reset = vi.fn();
    render(<HistoryError error={new Error('falha privada')} reset={reset} />);
    expect(screen.getByRole('heading', { name: 'Não foi possível abrir a história agora.' }))
      .toBeInTheDocument();
    expect(screen.queryByText('falha privada')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 4: Executar os testes e confirmar a falha esperada**

Run: `npm test -- src/app/historia src/app/membros/page.test.tsx`

Expected: FAIL porque `/historia` não existe e `/membros` ainda renderiza o diretório.

- [ ] **Step 5: Implementar `HistoryNarrative`**

```tsx
import Link from 'next/link';
import { CRATER_HISTORY } from '@/content/crater-history';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberGrid } from '@/features/members/MemberGrid';
import styles from './history.module.css';

export function HistoryNarrative({
  members,
  showPanelLink,
}: {
  members: readonly PublicMemberSummary[];
  showPanelLink: boolean;
}) {
  return (
    <article className={styles.story}>
      <header className={styles.storyHero}>
        <p className={styles.eyebrow}>Memória oficial · Sociedade da Cratera</p>
        <h1>{CRATER_HISTORY.title}</h1>
        <p>{CRATER_HISTORY.excerpt}</p>
      </header>
      <div className={styles.chapters}>
        {CRATER_HISTORY.chapters.map((chapter, index) => (
          <section className={styles.chapter} id={chapter.id} key={chapter.id}>
            <div className={styles.chapterIndex}><span>{String(index + 1).padStart(2, '0')}</span><p>{chapter.eyebrow}</p></div>
            <div><h2>{chapter.title}</h2><p>{chapter.body}</p></div>
          </section>
        ))}
      </div>
      <section className={styles.members} id="integrantes" aria-labelledby="members-title">
        <header className={styles.membersHeader}>
          <div><p className={styles.eyebrow}>Diretório público</p><h2 id="members-title">Os oito Crateristas</h2></div>
          {showPanelLink ? <Link href="/painel">Suas avaliações pendentes</Link> : null}
        </header>
        <MemberGrid members={[...members]} />
      </section>
      <footer className={styles.storyFooter}>
        <p className={styles.eyebrow}>A história continua à mesa</p>
        <h2>Consulte os registros preservados pela Sociedade.</h2>
        <Link href="/registros">Explorar restaurantes</Link>
      </footer>
    </article>
  );
}
```

- [ ] **Step 6: Implementar a rota e o redirecionamento**

```tsx
// src/app/historia/page.tsx
import { PublicShell } from '@/components/shell/PublicShell';
import { HistoryNarrative } from '@/features/history/HistoryNarrative';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const repository = getReviewRepository();
  const [members, viewer] = await Promise.all([
    repository.listPublicMembers(),
    findOptionalMember(),
  ]);
  return <PublicShell viewer={viewer ? 'member' : 'visitor'}><HistoryNarrative members={members} showPanelLink={Boolean(viewer)} /></PublicShell>;
}
```

```tsx
// src/app/membros/page.tsx
import { permanentRedirect } from 'next/navigation';

export default function MembersRedirect(): never {
  permanentRedirect('/historia#integrantes');
}
```

- [ ] **Step 7: Criar estilos editoriais e estados da rota**

`history.module.css` deve conter exatamente a estrutura abaixo; loading/error reutilizam `.routeState`, `.eyebrow` e `.retryButton`:

```css
.story { overflow: clip; }
.storyHero { width: min(calc(100% - 160px), 1120px); min-height: 670px; display: grid; align-content: center; margin: 0 auto; padding: 100px 0; }
.eyebrow { color: var(--ember-bright); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
.storyHero h1 { max-width: 980px; margin-top: 18px; color: var(--ink); font-size: clamp(5rem, 7vw, 8rem); font-weight: 520; letter-spacing: -0.06em; line-height: 0.86; }
.storyHero > p:last-child { max-width: 760px; margin-top: 38px; color: var(--ink-muted); font-family: var(--font-editorial), Georgia, serif; font-size: 1.35rem; line-height: 1.65; }
.chapters { border-top: 1px solid var(--line); }
.chapter { width: min(calc(100% - 160px), 1120px); min-height: 520px; display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: center; gap: 72px; margin: 0 auto; padding: 100px 0; border-bottom: 1px solid var(--line); }
.chapter:nth-child(even) { grid-template-columns: minmax(0, 1fr) 220px; }
.chapter:nth-child(even) .chapterIndex { grid-column: 2; grid-row: 1; }
.chapterIndex span { color: var(--ember-bright); font-family: var(--font-editorial), Georgia, serif; font-size: 5rem; line-height: 1; }
.chapterIndex p { margin-top: 10px; color: var(--ink-muted); font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; }
.chapter h2 { color: var(--ink); font-size: clamp(3.4rem, 5vw, 6rem); font-weight: 540; letter-spacing: -0.05em; line-height: 0.95; }
.chapter h2 + p { max-width: 760px; margin-top: 26px; color: var(--ink-muted); font-family: var(--font-editorial), Georgia, serif; font-size: 1.3rem; line-height: 1.75; }
.members { width: min(calc(100% - 96px), var(--page-max)); margin: 0 auto; padding: 132px 0 150px; }
.membersHeader { display: flex; align-items: end; justify-content: space-between; gap: 48px; margin-bottom: 50px; }
.membersHeader h2 { margin-top: 12px; font-size: clamp(3.6rem, 5vw, 6rem); font-weight: 540; letter-spacing: -0.05em; }
.membersHeader a, .storyFooter a { min-height: 44px; display: inline-flex; align-items: center; padding: 0 20px; border: 1px solid var(--ember); background: var(--ember); color: var(--canvas); font-size: 0.8rem; font-weight: 800; }
.storyFooter { min-height: 560px; display: grid; place-content: center; justify-items: center; padding: 120px 80px; border-top: 1px solid var(--line); background: var(--surface); text-align: center; }
.storyFooter h2 { max-width: 820px; margin-top: 16px; font-size: clamp(3rem, 4.5vw, 5.6rem); font-weight: 540; letter-spacing: -0.05em; line-height: 0.96; }
.storyFooter a { margin-top: 32px; }
.routeState { min-height: 680px; display: grid; place-content: center; justify-items: center; padding: 80px; text-align: center; }
.routeState h1 { margin-top: 14px; font-size: 3rem; font-weight: 560; }
.routeState > p:last-of-type { max-width: 540px; margin-top: 14px; color: var(--ink-muted); }
.retryButton { min-height: 44px; margin-top: 24px; padding: 0 20px; border: 1px solid var(--ember); background: var(--ember); color: var(--canvas); font-weight: 800; cursor: pointer; }
@media (max-width: 1280px) { .storyHero, .chapter { width: min(calc(100% - 96px), 1120px); } }
@media (prefers-reduced-motion: reduce) { .membersHeader a, .storyFooter a, .retryButton { transition: none; } }
```

```tsx
// src/app/historia/loading.tsx
import { PublicShell } from '@/components/shell/PublicShell';
import styles from '@/features/history/history.module.css';

export default function HistoryLoading() {
  return (
    <PublicShell viewer="visitor">
      <div className={styles.routeState} role="status">
        <p className={styles.eyebrow}>Memória oficial</p>
        <h1>Consultando a história...</h1>
        <p>Os capítulos e integrantes da Sociedade estão sendo reunidos.</p>
      </div>
    </PublicShell>
  );
}
```

```tsx
// src/app/historia/error.tsx
'use client';

import styles from '@/features/history/history.module.css';

interface HistoryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HistoryError({ reset }: HistoryErrorProps) {
  return (
    <div className="desktop-frame">
      <main className={styles.routeState}>
        <p className={styles.eyebrow}>Memória indisponível</p>
        <h1>Não foi possível abrir a história agora.</h1>
        <p>Tente novamente para consultar a memória pública da Sociedade.</p>
        <button className={styles.retryButton} onClick={reset} type="button">
          Tentar novamente
        </button>
      </main>
    </div>
  );
}
```

- [ ] **Step 8: Remover estados antigos de `/membros` e executar os testes**

Remover somente `src/app/membros/loading.tsx`, `error.tsx` e `route-states.test.tsx` depois que equivalentes existirem em `/historia`.

Run: `npm test -- src/app/historia src/app/membros/page.test.tsx src/features/members`

Expected: todos os testes PASS.

- [ ] **Step 9: Commitar a entrega**

```powershell
git add -- src/features/history src/app/historia src/app/membros
git commit -m "feat: unite crater history and members"
```

---

### Task 6: Atualizar navegação pública e destino da descida

**Files:**
- Modify: `src/components/shell/AppHeader.tsx`
- Modify: `src/components/shell/AppHeader.test.tsx`
- Modify: `src/components/shell/AppFooter.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.destination.test.ts`

**Interfaces:**
- Produces: marca do shell em `/home`, links “História” em `/historia` no header e footer.
- Produces: única ocorrência `router.push('/home')` em `src/app/page.tsx` e comentário adjacente coerente.
- Must not touch: `GourmetScene.tsx`, atmosfera ou qualquer outro trecho da cena.

- [ ] **Step 1: Alterar primeiro os testes do shell**

No primeiro teste de `AppHeader.test.tsx`, substituir a expectativa de “Membros” por:

```tsx
expect(screen.getByRole('link', { name: 'Crateristas — início' })).toHaveAttribute('href', '/home');
expect(screen.getByRole('link', { name: 'História' })).toHaveAttribute('href', '/historia');
expect(screen.queryByRole('link', { name: 'Membros' })).not.toBeInTheDocument();
```

No teste de `PublicShell`, importar `within` de Testing Library e acrescentar:

```tsx
const footerNavigation = screen.getByRole('navigation', { name: 'Navegação do rodapé' });
expect(within(footerNavigation).getByRole('link', { name: 'História' }))
  .toHaveAttribute('href', '/historia');
```

- [ ] **Step 2: Inverter o teste do destino da descida**

```ts
it('descends into the new public home without exercising Three.js', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'app', 'page.tsx'), 'utf8');
  expect(source.match(/router\.push\('\/home'\)/g)).toHaveLength(1);
  expect(source).not.toContain("router.push('/registros')");
});
```

- [ ] **Step 3: Executar os testes e confirmar a falha esperada**

Run: `npm test -- src/components/shell/AppHeader.test.tsx src/app/page.destination.test.ts`

Expected: FAIL porque a navegação ainda aponta a `/membros` e a descida ainda aponta a `/registros`.

- [ ] **Step 4: Fazer as quatro substituições mínimas**

```tsx
// AppHeader.tsx
<Link className={styles.brand} href="/home" aria-label="Crateristas — início">
// ...
<Link className={styles.navLink} href="/historia">História</Link>

// AppFooter.tsx
<Link href="/historia">História</Link>

// src/app/page.tsx, sem nenhuma outra edição além deste comentário e do destino
// Redirect to the public home when descent completes (95% of the crater descent)
router.push('/home');
```

- [ ] **Step 5: Executar testes de regressão do shell e portal**

Run: `npm test -- src/components/shell/AppHeader.test.tsx src/app/page.destination.test.ts src/components/crater-atmosphere.test.ts`

Expected: todos os testes PASS.

- [ ] **Step 6: Confirmar pelo diff que a cena foi preservada**

Run: `git diff -- src/app/page.tsx src/components/GourmetScene.tsx src/components/crater-atmosphere.ts`

Expected: somente o comentário adjacente e uma linha de destino alterados em `src/app/page.tsx`; nenhum diff nos dois arquivos Three.js.

- [ ] **Step 7: Commitar a entrega**

```powershell
git add -- src/components/shell/AppHeader.tsx src/components/shell/AppHeader.test.tsx src/components/shell/AppFooter.tsx src/app/page.tsx src/app/page.destination.test.ts
git commit -m "feat: route public navigation through crater home"
```

---

### Task 7: Verificação integral, detector e acabamento visual limitado

**Files:**
- Modify only if evidence requires: files created or modified in Tasks 1–6.
- Update generated graph only: `graphify-out/` (never stage).

**Interfaces:**
- Consumes: aplicação completa dos Tasks 1–6.
- Produces: testes, tipos, lint, build, detector e QA visual aprovados; nenhum erro novo de console.

- [ ] **Step 1: Executar toda a suíte antes do acabamento visual**

```powershell
npm test
npm exec tsc -- --noEmit
npm run lint
```

Expected: todos os testes PASS, TypeScript sem erros e ESLint sem warnings novos.

- [ ] **Step 2: Executar o detector Impeccable exatamente uma vez**

Run:

```powershell
node C:\Users\patho\.agents\skills\impeccable\scripts\detect.mjs --json src/features/home src/features/history src/app/home src/app/historia
```

Expected: exit 0 sem achados, ou exit 2 com JSON. Verificar cada achado no contexto; corrigir achados reais em um único lote e documentar falsos positivos. Não executar o detector novamente.

- [ ] **Step 3: Iniciar o servidor e executar uma rodada visual desktop**

Iniciar `npm run dev` em sessão reutilizável/oculta. Usar `vercel:agent-browser-verify` ou o navegador disponível primeiro em 1440×900 e, na mesma rodada, em 1024×768 para verificar:

- `/`: cena abre, ciclo atmosférico continua e a descida termina em `/home`;
- `/home`: primeira dobra contém título e CTA sem rolagem; carrossel, setas, indicadores, estado sem foto e profundidade funcionam;
- `/historia`: quatro capítulos e `#integrantes` aparecem; fotos/fallbacks e cards continuam expansíveis;
- `/membros`: redireciona para `/historia#integrantes`;
- `/registros` e um `/restaurantes/[slug]`: shell atualizado sem regressão;
- em 1024×768: conteúdo público sem corte destrutivo ou rolagem horizontal além do piso desktop explícito;
- navegação por Tab/Shift+Tab, setas no carrossel, foco visível;
- emulação de `prefers-reduced-motion: reduce` sem movimento essencial;
- console sem novos erros ou warnings de hydration/imagem.

Expected: evidência visual e funcional para cada item. Parar o servidor iniciado para a verificação ao concluir.

- [ ] **Step 4: Corrigir em um único lote somente defeitos comprovados**

Para qualquer defeito funcional, primeiro acrescentar um teste que falhe, executar o teste para confirmar, então corrigir. Para defeitos puramente visuais, registrar a propriedade e viewport observados, ajustar o CSS responsável e fazer no máximo uma segunda rodada de confirmação em 1440×900 e 1024×768. Não iniciar ciclos abertos de polimento.

- [ ] **Step 5: Atualizar o grafo e executar a verificação final limpa**

```powershell
graphify update .
npm test
npm exec tsc -- --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: comandos aprovados; `git status` mostra apenas mudanças intencionais e `graphify-out/` não é adicionado ao índice.

- [ ] **Step 6: Commitar qualquer acabamento baseado em evidência**

Se o Task 7 alterou arquivos rastreados:

```powershell
git add -- src/app/home src/app/historia src/app/membros src/app/page.tsx src/app/page.destination.test.ts src/components/shell src/content/crater-history.ts src/features/home src/features/history
git diff --cached --check
git commit -m "fix: polish public crater experience"
```

Se não houve alterações rastreadas, não criar commit vazio.

- [ ] **Step 7: Solicitar revisão e concluir a branch**

Usar `superpowers:requesting-code-review` contra o commit anterior ao Task 1, corrigir apenas achados comprovados com TDD e repetir a verificação relevante. Depois usar `superpowers:finishing-a-development-branch` para apresentar a integração; nesta branch `develop`, publicar somente os commits aprovados e não adicionar `graphify-out/`.
