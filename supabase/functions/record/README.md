# record — прокси к API «Радио Рекорд»

API радио не отдаёт CORS-заголовки, поэтому браузер ходит к нему через эту функцию. Она проксирует два пути и ничего больше:

| Путь        | Апстрим              | Кэш                                    |
| ----------- | -------------------- | -------------------------------------- |
| `/stations` | `/api/stations/`     | `public, max-age=3600, s-maxage=86400` |
| `/now`      | `/api/stations/now/` | `public, max-age=15`                   |

Любой другой путь — 404. Если апстрим не ответил за 5 секунд или вернул ошибку — 502 с JSON `{ "error": "..." }`.

## Деплой

Данные публичные, поэтому JWT не нужен:

```bash
supabase functions deploy record --no-verify-jwt
```

## Пример запроса

```bash
curl https://<project-ref>.supabase.co/functions/v1/record/stations
curl https://<project-ref>.supabase.co/functions/v1/record/now
```
