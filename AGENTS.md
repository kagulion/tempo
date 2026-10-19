# AGENTS.md

## shadcn/ui

- For any shadcn/ui task (adding, styling, fixing or composing components), use the skills in `.agents/skills/` (mirrored in `.claude/skills/`):
  - `shadcn`: general work with components and the registry;
  - `migrate-radix-to-base`: migrating components from Radix UI to Base UI.
- The project is fully on Base UI (`@base-ui/react`): `components.json` uses the `base-nova` style, and `radix-ui` is not installed. Add components with `shadcn add`; they arrive as `base-nova` variants. Don't add Radix back.

## Widgets

A widget is a window that a dock button opens. Read the comments in `src/widgets/registry.ts` and `src/App.tsx` first: they explain the layout fields. When adding a widget:

- Layout: from `xl` (1280px) the three columns are a CSS grid: the centre is a fixed 28rem, side windows are `w-full` with a `max-w` ceiling (`placement`), so nothing overlaps; below `xl` only one window is shown at a time (`mediaQueries.singleWindow`, `openWindow` in `src/widgets/dock/useDock.ts`).
- Put it in its own folder, `src/widgets/<id>/`: the window `<Name>Widget.tsx`, state in `use<Name>.ts`, and logic in plain modules with tests (see Checks).
- Register it in `definitions` in `src/widgets/registry.ts`. The order there sets the order of buttons in the dock group and of windows in the column. A new dock group also needs a place in `dockPanels` in `src/widgets/dock/Dock.tsx`.
- Build the window from `Widget` and `WidgetHeader` (`src/widgets/Widget.tsx`), with small header buttons as `Button variant="glass" size="icon-sm"`. The component takes `className` and passes it to `Widget`. It never positions itself: `column`, `anchor` and `placement` in the registry do that.
- A closed window stays mounted and only gets `hidden`. Timers, audio, polling and canvas loops keep running, so pause them when the window is hidden, unless they're meant to keep working (like radio or the timer).
- Saved state: add the key to `storageKeys` in `src/lib/storage.ts`, and read it through `usePersistentState` (one hook) or `createPersistentStore` (shared between components), always with a `Parse` that rejects bad data. If you change a saved format, convert the old one in `Parse` and add a case to `src/widgets/saved-formats.test.ts`. Otherwise returning visitors silently lose their settings.
- Reuse shared pieces instead of making new ones: `getAudioContext` (`src/lib/audio.ts`) for sound, `duckLevel` (`src/lib/ducking.ts`) so sound gets quieter around the timer signal, and `mediaQueries` with `useMediaQuery` for media queries. For notifications use `toast` from `src/components/ui/toast.tsx` (Base UI, `<Toaster />` is mounted once in `App.tsx`; don't add sonner), and to open a window from code outside the dock use `requestOpenWidget` (`src/widgets/dock/openRequests.ts`).
- Check the layout on a phone and at `sm`/`xl` sizes with neighbouring windows open. Decide whether the window shrinks and scrolls, or keeps its height (`sm:shrink-0`) and makes its neighbours shrink. If it should replace another window, give both the same `slot`.
- Write code comments and UI text in Russian, like the rest of the code.

## Checks

- Before finishing a change, run `pnpm check`, `pnpm lint` and `pnpm test`; CI runs the same plus `pnpm build`.
- Linting uses oxlint (`.oxlintrc.json`), not ESLint: typescript-eslint doesn't support TypeScript 7 yet. Warnings fail `pnpm lint`.
- Tests are Vitest, in Node, next to the code (`phases.ts` → `phases.test.ts`). Keep logic that is worth testing in plain modules without React (like `src/widgets/timer/phases.ts`, `src/widgets/stats/visits.ts`) and test those.
