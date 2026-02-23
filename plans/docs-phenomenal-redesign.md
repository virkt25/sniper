# SNIPER Docs — Phenomenal Redesign Plan

> Goal: Make the SNIPER documentation site the most visually impressive, interactive, and developer-loved docs site of 2026.

## Current State

- **VitePress 1.6.3** with default theme extended
- 2 custom Vue components (PersonaCard, TeamDiagram)
- 135 auto-generated reference pages + 16 hand-written guide pages
- Basic glassmorphism/gradient styling on home page
- Local search (built-in VitePress)
- No animations beyond hover effects
- No interactive demos or live examples
- Standard two-column layout throughout

---

## Phase 1: Visual Identity & Motion Design

**The foundation — make every page feel alive.**

### 1.1 Custom Theme Layer

- [ ] Build a custom VitePress theme wrapper that extends DefaultTheme
- [ ] Design a **SNIPER design system** with tokens:
  - Color palette: deep navy/charcoal base, electric blue + hot orange accents (matching the SNIPER brand)
  - Typography scale: Inter/Geist Sans for body, JetBrains Mono for code
  - Spacing/radius tokens for consistency
  - Glass/blur variables for depth layers
- [ ] Custom `Layout.vue` with:
  - Animated gradient mesh background (subtle, performant via CSS)
  - Floating particle system in hero areas (canvas-based, lazy-loaded)
  - Custom header with blur-on-scroll + brand animation

### 1.2 Page Transitions

- [ ] Enable VitePress View Transitions API
- [ ] Cross-fade page content with staggered element entry
- [ ] Sidebar active item morphing animation
- [ ] Color mode toggle with circular reveal animation (VitePress native support)

### 1.3 Scroll-Driven Animations (Pure CSS)

- [ ] Reading progress bar at top of every page (`animation-timeline: scroll()`)
- [ ] Section headings fade-slide in on scroll (`animation-timeline: view()`)
- [ ] Code blocks slide up with subtle parallax on scroll
- [ ] Sidebar TOC highlights with smooth scroll-linked progress
- [ ] Stats/numbers on home page count-up on scroll into view

### 1.4 Micro-interactions

- [ ] Code block copy button: success ripple + checkmark morph
- [ ] Navigation links: underline draw animation on hover
- [ ] Cards: 3D tilt effect on hover (CSS `perspective` + `transform`)
- [ ] Buttons: gradient shift + subtle scale on hover/active
- [ ] Sidebar items: slide-in indicator bar on active

---

## Phase 2: Home Page — The Showstopper

**First impressions matter. This page should make people stop scrolling.**

### 2.1 Hero Section

- [ ] Full-viewport hero with animated gradient mesh (CSS `@property` animated gradients)
- [ ] Large animated SNIPER logo with crosshair/scope animation on load
- [ ] Tagline with typewriter/reveal effect
- [ ] CTA buttons with glow pulse + hover gradient shift
- [ ] Terminal-style demo showing `sniper init` → full lifecycle in ~10 seconds (auto-playing, loopable)

### 2.2 "How It Works" Section

- [ ] Interactive SNIPER lifecycle wheel/flow:
  - **S**pawn → **N**avigate → **I**mplement → **P**arallelize → **E**valuate → **R**elease
  - Circular/hexagonal diagram with animated connections
  - Click each phase to expand details with slide-in panels
  - Auto-rotates through phases with progress indicators
- [ ] Built as a Vue component, not an image — fully interactive

### 2.3 Social Proof / Stats Section

- [ ] Animated counters (phases, personas, teams, templates) with scroll trigger
- [ ] GitHub stars badge (live from API)
- [ ] "Used by" logo carousel (once adoption grows)
- [ ] Testimonial cards with glassmorphism

### 2.4 Feature Grid

- [ ] Bento-grid layout (asymmetric, Vercel/Linear style)
- [ ] Each cell has a unique mini-animation or illustration:
  - "Parallel Teams" → animated dots connecting in real-time
  - "AI Personas" → morphing avatar/role badges
  - "Review Gates" → checkmark cascade animation
  - "Domain Packs" → stacking card animation
- [ ] Hover reveals deeper description with smooth expand

### 2.5 Live Terminal Demo

- [ ] Embedded terminal component showing SNIPER commands in action
- [ ] Syntax-highlighted command output with realistic typing animation
- [ ] Multiple "scenes" user can tab through (init, discover, plan, sprint)
- [ ] Dark terminal aesthetic with SNIPER-branded prompt

---

## Phase 3: Content Experience

**Make reading the docs a joy, not a chore.**

### 3.1 Three-Column Layout for Reference Pages

- [ ] Stripe-inspired layout for command/persona/team reference:
  - Left: navigation sidebar
  - Center: explanation and prose
  - Right: live examples, YAML snippets, related items
- [ ] Sticky right column that follows scroll
- [ ] Responsive: collapses to 2-col on tablet, 1-col on mobile

### 3.2 Interactive Code Blocks

- [ ] YAML blocks with collapsible sections for long configs
- [ ] "Copy as file" button that downloads the YAML
- [ ] Syntax highlighting with SNIPER-specific token colors
- [ ] Diff view for showing before/after configurations
- [ ] Line highlighting with annotations (VitePress native, but styled)

### 3.3 Mermaid Diagrams

- [ ] Interactive, zoomable Mermaid diagrams for:
  - SNIPER lifecycle flow
  - Team composition dependencies
  - Phase artifact flow
  - Review gate decision trees
- [ ] Custom Mermaid theme matching SNIPER colors
- [ ] Click-to-expand for complex diagrams

### 3.4 Enhanced Custom Components

- [ ] **PersonaCard v2**: Animated layer badges, expandable details, link to full persona page
- [ ] **TeamDiagram v2**: Interactive — click members to see their persona stack, animated connection lines between dependent members
- [ ] **PhaseTimeline**: Horizontal timeline showing all 6 phases with current phase highlighted, clickable
- [ ] **CommandPalette**: Searchable command reference widget (Cmd+K style)
- [ ] **ArtifactViewer**: Shows template outputs with tabs for different formats
- [ ] **ChecklistWidget**: Interactive checklist that tracks progress visually
- [ ] **ComparisonTable**: Side-by-side feature comparison with animated highlights

### 3.5 Guide Pages Polish

- [ ] Add "On this page" mini-map (enhanced TOC with scroll position)
- [ ] Callout boxes with custom icons: tip, warning, sniper-pro-tip, phase-note
- [ ] "Edit on GitHub" button with pencil icon animation
- [ ] Estimated reading time badge
- [ ] Previous/Next navigation with preview cards (not just links)

---

## Phase 4: Search & AI

**Make finding information instant and intelligent.**

### 4.1 Enhanced Search

- [ ] Replace built-in search with a custom Cmd+K modal:
  - Fuzzy matching across all content
  - Category filters (Guide, Commands, Personas, Teams, Templates)
  - Recent searches
  - Keyboard navigation with preview panel
  - Search result highlighting in context
- [ ] Consider Algolia DocSearch or Pagefind for production search

### 4.2 AI Chat Assistant

- [ ] "Ask SNIPER" floating chat widget
- [ ] RAG-powered: indexed against all docs content
- [ ] Answers questions with citations back to relevant docs pages
- [ ] Suggests related pages and next steps
- [ ] Can generate example configurations based on user descriptions
- [ ] Options: Cloudflare AI, self-hosted via VitePress LLM plugin, or Mintlify-style

### 4.3 llms.txt Generation

- [ ] Auto-generate `/llms.txt` during build
- [ ] Structured index of all docs content for AI consumption
- [ ] Priority weighting: getting-started > guide > reference
- [ ] Include in sitemap and robots.txt

---

## Phase 5: Interactive Demos & Playground

**Let users experience SNIPER before installing it.**

### 5.1 Command Playground

- [ ] Web-based SNIPER command simulator
- [ ] Select a command → see simulated output in a terminal UI
- [ ] Shows what files get created, what agents get spawned
- [ ] Step-through mode for lifecycle phases

### 5.2 Persona Composer

- [ ] Interactive tool on the personas page
- [ ] Drag-and-drop persona layers to compose a custom agent
- [ ] Live preview of the resulting spawn prompt
- [ ] "Copy spawn prompt" button
- [ ] Visual representation of layer stacking

### 5.3 Team Builder

- [ ] Interactive team composition tool
- [ ] Select a phase → see recommended team
- [ ] Customize team members, see dependency graph update live
- [ ] Export as team YAML config

---

## Phase 6: Performance & Polish

**Speed is a feature. Polish is the difference between good and great.**

### 6.1 Performance

- [ ] Lazy-load all heavy components (terminal, diagrams, playground)
- [ ] Use `content-visibility: auto` for long reference pages
- [ ] Optimize images: WebP/AVIF with `<picture>` fallbacks
- [ ] Preload critical fonts (Inter, JetBrains Mono)
- [ ] Target: Lighthouse 95+ on all pages
- [ ] Bundle analysis: keep JS under 100KB gzipped for initial load

### 6.2 Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] Reduced motion media query for all animations
- [ ] Keyboard navigation for all interactive components
- [ ] Screen reader testing for custom components
- [ ] Focus indicators that match the design system

### 6.3 Mobile Experience

- [ ] Touch-optimized interactions (swipe for tabs, pull to reveal)
- [ ] Bottom navigation bar on mobile
- [ ] Collapsible sections default-closed on mobile
- [ ] Test on real devices: iPhone, iPad, Android

### 6.4 Dark/Light Mode

- [ ] Both modes are first-class citizens
- [ ] Unique color treatments per mode (not just inverted)
- [ ] Dark mode: deep space theme with neon accents
- [ ] Light mode: clean white with warm shadows and blue accents
- [ ] Animated transition between modes (View Transitions API)

---

## Phase 7: Meta & SEO

### 7.1 SEO & Social

- [ ] OpenGraph images auto-generated per page (title + SNIPER branding)
- [ ] Twitter/X card meta tags
- [ ] Structured data (JSON-LD) for software documentation
- [ ] Sitemap.xml with proper priority/changefreq
- [ ] Canonical URLs

### 7.2 Analytics

- [ ] Privacy-respecting analytics (Plausible or Fathom)
- [ ] Track: page views, search queries, time on page, scroll depth
- [ ] Feedback widget on each page ("Was this helpful?")

---

## Implementation Priority

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Phase 1: Visual Identity & Motion | 2-3 days | Foundation for everything |
| P0 | Phase 2: Home Page Showstopper | 2-3 days | First impression, viral potential |
| P1 | Phase 3: Content Experience | 3-4 days | Daily user satisfaction |
| P1 | Phase 6: Performance & Polish | 1-2 days | Credibility |
| P2 | Phase 4: Search & AI | 2-3 days | Power user delight |
| P2 | Phase 7: Meta & SEO | 1 day | Discoverability |
| P3 | Phase 5: Interactive Demos | 3-5 days | Wow factor, conversion |

**Recommended order**: Phase 1 → Phase 2 → Phase 6 (perf baseline) → Phase 3 → Phase 4 → Phase 7 → Phase 5

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stay on VitePress? | **Yes** | Already invested, Vue components work great, plugins ecosystem is sufficient |
| Fonts | Inter + JetBrains Mono | Industry standard, excellent readability, free |
| Animation approach | CSS-first, Vue for complex | Scroll-driven animations are pure CSS; interactive components use Vue |
| Search | Pagefind → later Algolia | Pagefind is free, fast, works offline; Algolia when traffic justifies |
| AI Chat | Phase 2 goal | Evaluate Cloudflare AI Search or self-hosted RAG |
| Hosting | Cloudflare Pages or Vercel | Edge-served, fast globally, free tier |
| Analytics | Plausible | Privacy-first, lightweight, no cookie banner needed |

---

## Inspiration Board

- **Stripe Docs** — three-column layout, interactive code, personalized examples
- **Linear** — motion design, glassmorphism, dark mode excellence
- **Vercel** — clean typography, bento grid, framework-aware content
- **Tailwind** — interactive utility demos, search UX
- **Resend** — minimal but impactful animations, great dark mode
- **Framer Motion docs** — meta: docs about animation that themselves animate beautifully
- **Raycast** — command palette UX, keyboard-first navigation

---

## Success Metrics

- **"Wow" reaction**: People share the docs site on social media unprompted
- **Lighthouse**: 95+ performance, 100 accessibility
- **Time to answer**: Users find what they need in < 30 seconds
- **Bounce rate**: < 30% on guide pages
- **Search satisfaction**: > 80% of searches lead to a page click
- **AI chat accuracy**: > 90% of answers are correct with proper citations
