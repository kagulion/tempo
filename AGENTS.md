# AGENTS.md

## shadcn/ui

- For any shadcn/ui task (adding, styling, fixing or composing components), use the skills in `.agents/skills/` (mirrored in `.claude/skills/`):
  - `shadcn`: general work with components and the registry;
  - `migrate-radix-to-base`: migrating components from Radix UI to Base UI.
- The project is fully on Base UI (`@base-ui/react`): `components.json` uses the `base-nova` style, and `radix-ui` is not installed. Add components with `shadcn add`; they arrive as `base-nova` variants. Don't add Radix back.
