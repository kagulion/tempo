# button

2026-10-14, golden pair via merge (`git merge-file`: radix-nova golden as ancestor, project file, base-nova golden), merged with zero conflicts. Migrated; this was the last Radix wrapper, so the project is now fully on Base UI.

## Changed

- `src/components/ui/button.tsx` — `Slot` from `radix-ui` and the `asChild` prop replaced with the `@base-ui/react/button` primitive (`ButtonPrimitive.Props`, polymorphism via `render`), exactly as in the `base-nova` registry variant. Project customizations survived the merge: the `glass` and `glass-solid` variants (lines 21–24). Like the registry variant, the wrapper no longer sets `data-variant` / `data-size`; nothing in `src/` reads them.
- `components.json` — `style`: `radix-nova` → `base-nova`. `shadcn info` now reports `"base": "base"`, so `shadcn add` delivers Base UI variants.
- `package.json`, `pnpm-lock.yaml` — `radix-ui` removed with `pnpm remove`; no `@radix-ui/*` packages remain in the lockfile.
- `AGENTS.md`, `README.md`, `docs/widgets.md` — removed the notes about the Radix button and the `radix-nova` style.
- Call sites: none needed. No consumer used `asChild`.

Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` is clean, as is the rest of `src/`, `package.json`, `components.json` and `pnpm-lock.yaml`.

Checks: `tsc -b` passes (baseline passed too), `vite build` passes, bundle 487.4 → 484.5 kB.

## Left alone

- `src/components/ui/combobox.tsx`, `progress.tsx`, `slider.tsx`, `tabs.tsx` — already on Base UI.
- `src/widgets/dock/Dock.tsx`, `FullscreenButton.tsx`, the effect cards and wallpaper thumbnails — plain `<button>` elements, not radix.
- `.agents/skills/` and `.claude/skills/` — skill docs mention Radix by design.

## Behavior changes

- Base UI `Button` renders `type="button"` by default; the Radix version rendered a bare `<button>` (`type="submit"` by default). The site has no forms, so nothing changes in practice, but a button inside a future `<form>` will no longer submit unless given `type="submit"`.
- `data-variant` and `data-size` attributes are gone from rendered buttons (matches the registry).

## Verify by hand

- Click the bell in the timer header: the icon toggles and the button stays highlighted on hover.
- With no ambience sounds on, the reset and play buttons in the Sounds window are dimmed and not clickable.
- Tab through the timer window: each button shows the focus ring; Enter and Space activate it.
- Start, pause and resume the timer with the wide glass-solid button.
- In the radio window, the heart (favorite) and transport buttons react to clicks as before.
