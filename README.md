# Tempo

Атмосферная страница-«таверна»: полноэкранные фэнтези-обои, интернет-радио со всего мира, фоновые звуки (камин, дождь, ветер, шумы), помидоро-таймер, статистика (онлайн, серия дней, время на сайте) и эффект летящих искр. Окна виджетов открываются с панели внизу экрана.

## Документация

- [Виджеты](docs/widgets.md)
- [О радио](docs/radio.md)
- [О звуках](docs/ambience.md)
- [О таймере](docs/timer.md)
- [О статистике](docs/stats.md)
- [Об обоях](docs/wallpaper.md)
- [О YouTube-фоне](docs/youtube.md)
- [О Rutube-фоне](docs/rutube.md)
- [Об эффектах](docs/effects.md)

## Стек

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Base UI, пресет Nova)
- [Vitest](https://vitest.dev) — тесты, [oxlint](https://oxc.rs/docs/guide/usage/linter) — линтер

## Разработка

```sh
pnpm install
pnpm dev
```

## Скрипты

| Команда           | Что делает                                       |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | dev-сервер с HMR                                 |
| `pnpm build`      | проверка типов и сборка в `dist/`                |
| `pnpm preview`    | локальный просмотр собранной версии              |
| `pnpm check`      | только проверка типов                            |
| `pnpm lint`       | линтер oxlint и проверка форматирования Prettier |
| `pnpm format`     | форматирование Prettier                          |
| `pnpm test`       | тесты Vitest один раз                            |
| `pnpm test:watch` | тесты в режиме наблюдения                        |

На каждый push в `main` и на каждый pull request GitHub Actions запускает `check`, `lint`, `test` и `build` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

**Почему oxlint, а не ESLint:** `typescript-eslint` пока не поддерживает TypeScript 7. Oxlint не зависит от API TypeScript и проверяет те же правила хуков React (`rules-of-hooks`, `exhaustive-deps`). Настройки — в [`.oxlintrc.json`](.oxlintrc.json).

## shadcn/ui

Компоненты добавляются командой:

```sh
pnpm dlx shadcn@latest add <component>
```

Они попадают в `src/components/ui/`.
