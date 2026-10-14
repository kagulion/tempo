# AGENTS.md

## shadcn/ui

- For any shadcn/ui task (adding, styling, fixing or composing components), use the skills in `.agents/skills/` (mirrored in `.claude/skills/`):
  - `shadcn`: general work with components and the registry;
  - `migrate-radix-to-base`: migrating components from Radix UI to Base UI.
- The project is fully on Base UI (`@base-ui/react`): `components.json` uses the `base-nova` style, and `radix-ui` is not installed. Add components with `shadcn add`; they arrive as `base-nova` variants. Don't add Radix back.

## Checks

- Before finishing a change, run `pnpm check`, `pnpm lint` and `pnpm test`; CI runs the same plus `pnpm build`.
- Linting uses oxlint (`.oxlintrc.json`), not ESLint: typescript-eslint doesn't support TypeScript 7 yet. Warnings fail `pnpm lint`.
- Tests are Vitest, in Node, next to the code (`phases.ts` → `phases.test.ts`). Keep logic that is worth testing in plain modules without React (like `src/widgets/timer/phases.ts`, `src/widgets/stats/visits.ts`) and test those.
