# TypeScript Frontend Mixin

You are working in a TypeScript frontend environment. Follow these patterns:

## Component Typing
- Define a `Props` interface for every component; export it alongside the component.
- Use `React.FC<Props>` sparingly; prefer function declarations with typed props.
- For Vue, use `defineProps<Props>()` with interface-based generics.

## Props Conventions
- Mark optional props with `?`; provide sensible defaults via destructuring.
- Use `children: React.ReactNode` (React) or slots (Vue) for composition.
- Avoid `any` in prop types; use discriminated unions for variant props.

## Hook & Composable Typing
- Explicitly type return values of custom hooks / composables.
- Use generics for reusable hooks (e.g., `useFetch<T>(url): { data: T | null }`).
- Type event handlers with the specific event type (`React.ChangeEvent<HTMLInputElement>`).

## Styling
- When using **Tailwind**, keep class strings in the component; use `clsx`/`cn` for conditionals.
- When using **CSS-in-JS**, type theme tokens and ensure style objects satisfy `CSSProperties`.
- Shared design tokens should live in a typed `theme.ts` constants file.

## State & Data Fetching
- Type all API response shapes; generate types from OpenAPI specs when available.
- Use discriminated unions for loading/error/success states instead of boolean flags.
- Prefer `as const` assertions for static configuration objects and route definitions.
