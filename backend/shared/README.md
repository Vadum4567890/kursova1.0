# `backend/shared`

Контракт помилок і (опційно) Express error middleware для поступової уніфікації відповідей між сервісами.

- `error.ts` — типи, коди, `AppError`
- `error-handler.ts` — приклад глобального `errorHandler` / `asyncHandler` для Express (підключай у сервісі за потреби)

Докладніше: `docs/ERROR_CONTRACT.md`.
