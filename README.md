# Tempo

Атмосферная страница-«таверна»: полноэкранные фэнтези-обои, фоновая музыка и эффект летящих искр.

## Стек

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Radix, пресет Nova)

## Разработка

```sh
pnpm install
pnpm dev
```

## Скрипты

| Команда        | Что делает                          |
| -------------- | ----------------------------------- |
| `pnpm dev`     | dev-сервер с HMR                    |
| `pnpm build`   | проверка типов и сборка в `dist/`   |
| `pnpm preview` | локальный просмотр собранной версии |
| `pnpm check`   | только проверка типов               |
| `pnpm lint`    | проверка форматирования Prettier    |
| `pnpm format`  | форматирование Prettier             |

## shadcn/ui

Компоненты добавляются командой:

```sh
pnpm dlx shadcn@latest add <component>
```

Они попадают в `src/components/ui/`.
