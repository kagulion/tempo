# AGENTS.md

## shadcn/ui

- For any shadcn/ui task (adding, styling, fixing or composing components), use the skills in `.agents/skills/` (mirrored in `.claude/skills/`):
  - `shadcn`: general work with components and the registry;
  - `migrate-radix-to-base`: migrating components from Radix UI to Base UI.
- Prefer Base UI (`@base-ui/react`, `base-nova` registry variants) over Radix.
- `components.json` still uses the `radix-nova` style, and `src/components/ui/button.tsx` is Radix-based (`asChild`). `base-nova` components that depend on the Base UI button (`render` prop) don't work as-is. Don't silently overwrite `button.tsx`: build the component directly on Base UI primitives (like `src/components/ui/combobox.tsx`) or migrate the button with `migrate-radix-to-base`.
