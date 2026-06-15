# Contexto do Projeto: Crateristas

Este documento serve como guia e referência de contexto para agentes de IA que venham a colaborar no desenvolvimento do projeto **Crateristas**.

---

## 1. Visão Geral do Projeto
O **Crateristas** é um portal gastronômico exclusivo e intimista planejado para um grupo de amigos ("Os Discípulos do Guizão") documentarem e avaliarem experiências sensoriais detalhadas em restaurantes de São Paulo. O design adota uma estética de luxo sombrio (Sunset/Twilight/Gold), com transições fluidas e efeitos tridimensionais.

---

## 2. Stack Tecnológica
*   **Framework Principal**: Next.js 16.2.7 (com suporte a Turbopack e App Router).
*   **Linguagem**: TypeScript / React 19.
*   **Estilização (CSS)**: CSS Puro (Vanilla CSS) localizado em [src/app/globals.css](file:///C:/Users/patho/Documents/GitHub/crateristas/src/app/globals.css). **Não é utilizado TailwindCSS**.
*   **Efeitos 3D**: Three.js (0.184.0) para a animação da cratera na landing page.
*   **Ícones**: Lucide React.
*   **Banco de Dados**: Neon Serverless Postgres via `@neondatabase/serverless` com fallback em `localStorage` para modo demonstração (offline).

---

## 3. Arquitetura do Banco de Dados
A tabela principal do banco de dados é a `reviews`.

### Schema SQL
```sql
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  overall INT NOT NULL,           -- Nota geral calculada (1 a 5 estrelas)
  taste INT NOT NULL,             -- Sabor (1 a 10)
  service INT NOT NULL,           -- Serviço (1 a 10)
  ambiance INT NOT NULL,          -- Ambiente (1 a 10)
  cost_benefit INT,               -- Custo-Benefício (1 a 10)
  ux INT,                         -- Experiência de Consumo (1 a 10)
  spend_per_person INT,           -- Gasto por Pessoa em R$
  price VARCHAR(10) NOT NULL,     -- Categoria de preço ($, $$, $$$, $$$$)
  description TEXT NOT NULL,      -- Texto detalhado da crítica
  image TEXT NOT NULL,            -- Imagem principal (URL ou Base64)
  images TEXT,                    -- Array JSON de imagens secundárias (multi-upload)
  author VARCHAR(100) NOT NULL,   -- Autor da crítica
  date VARCHAR(50) NOT NULL       -- Data formatada
);
```

> [!IMPORTANT]
> **Compatibilidade Retroativa**: A coluna `images` (que guarda múltiplas fotos) foi adicionada posteriormente. Ao ler registros antigos que possuem apenas `image`, o código deve gerar um fallback seguro:
> `const allImages = review.images ? JSON.parse(review.images) : [review.image];`

---

## 4. Estrutura de Rotas e Páginas Principais

*   **Landing Page (`/`)** - [src/app/page.tsx](file:///C:/Users/patho/Documents/GitHub/crateristas/src/app/page.tsx):
    *   Exibe a animação 3D procedural `GourmetScene` com foco no efeito de descida (plunge) na cratera conforme o usuário faz o scroll.
    *   Ao atingir 95% do scroll, redireciona o usuário automaticamente para `/home`.

*   **Painel Principal (`/home`)** - [src/app/home/page.tsx](file:///C:/Users/patho/Documents/GitHub/crateristas/src/app/home/page.tsx):
    *   Painel central contendo a listagem das críticas gastronômicas.
    *   Controles de busca textual e filtros de categorias de culinária.
    *   Seção "Os Discípulos do Guizão" mostrando perfis e cargos.
    *   Seção "Menu do Dia" interativa baseada no dia atual da semana.
    *   Card explicativo sobre a integração do Neon Serverless Postgres.

*   **Registrar Restaurante (`/add-restaurant`)** - [src/app/add-restaurant/page.tsx](file:///C:/Users/patho/Documents/GitHub/crateristas/src/app/add-restaurant/page.tsx):
    *   Formulário de cadastro contendo:
        *   Importador automático de dados via URL do Google Maps (`/api/parse-maps`).
        *   Seleção múltipla de imagens com pré-visualização e botões de exclusão.
        *   Sliders interativos para notas de Sabor, Serviço, Ambiente, Custo-benefício e UX. O fundo do slider muda dinamicamente de cor (Vermelho -> Amarelo -> Verde) com base no valor.
        *   Cálculo em tempo real da Média Decimal e do número correspondente de Estrelas (1 a 5).

*   **Detalhes do Restaurante (`/restaurant/[id]`)** - [src/app/restaurant/\[id\]/page.tsx](file:///C:/Users/patho/Documents/GitHub/crateristas/src/app/restaurant/%5Bid%5D/page.tsx):
    *   Exibe um banner grande da imagem ativa (480px de altura).
    *   Galeria de miniaturas abaixo da foto principal para alternar entre as múltiplas imagens enviadas.
    *   Exibição detalhada de todas as notas do crítico em formato de grid.

---

## 5. Diretrizes Importantes de Design (Aesthetics)
*   **Paleta de Cores**:
    *   Fundo Primário: `#130917` (Deep twilight/violet).
    *   Fundo Secundário: `#1a1020`.
    *   Destaques/Acentos: `#e5683b` (Sunset orange-gold).
    *   Textos: `#f5f5f5` (primário) e `#d1b8c8` (secundário).
*   **Estrelas com Degradê Animado**:
    *   As estrelas das avaliações usam classes CSS (`gradient-star-low`, `gradient-star-medium`, `gradient-star-high`) que aplicam um gradiente dinâmico baseado na nota (vermelho para baixas, amarelo para médias, verde para altas). O gradiente se move sutilmente com base na animação `@keyframes gradientFlow`.
*   **Linhas Divisórias**:
    *   Remova divisores laranjas desnecessários debaixo das fotos principais. Prefira sombreamentos suaves (`box-shadow`) e bordas suaves do sistema de design (`var(--border-light)`).

---

## 6. Primeiros Passos para Desenvolvimento
1.  **Variáveis de Ambiente**:
    Configure o arquivo `.env.local` com a string de conexão do Neon Postgres:
    ```env
    DATABASE_URL="postgres://usuario:senha@host/dbname?sslmode=require"
    ```
2.  **Iniciar Servidor de Dev**:
    ```bash
    npm run dev
    ```
3.  **Compilar para Produção**:
    ```bash
    npm run build
    ```
