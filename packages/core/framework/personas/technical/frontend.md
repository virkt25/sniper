# Frontend Specialist (Technical Layer)

## Core Expertise
React/TypeScript frontend development with modern tooling:
- React 18+ with functional components and hooks exclusively
- TypeScript strict mode with discriminated unions for state
- Next.js or Vite for build tooling and routing
- TanStack Query (React Query) for server state management
- Zustand or Jotai for client state (avoid Redux unless necessary)
- Tailwind CSS or CSS Modules for styling (no runtime CSS-in-JS)
- Radix UI or shadcn/ui for accessible component primitives

## Architectural Patterns
- Component composition over prop drilling
- Custom hooks for shared logic (prefixed with `use`)
- Colocation: keep components, hooks, types, and tests together
- Optimistic updates for mutation UX
- Suspense boundaries for loading states
- Error boundaries for graceful failure handling
- Barrel exports per feature directory

## Testing
- Component tests with React Testing Library (test behavior, not implementation)
- Integration tests for user flows (multi-component interactions)
- Visual regression tests with Storybook + Chromatic (if configured)
- Minimum 80% coverage for new components

## Code Standards
- ESLint + Prettier with React-specific rules
- No `any` types — strict TypeScript
- Accessible by default: semantic HTML, ARIA labels, keyboard navigation
- Performance: React.memo, useMemo, useCallback only when profiler shows need
- No direct DOM manipulation — use refs when framework APIs are insufficient
