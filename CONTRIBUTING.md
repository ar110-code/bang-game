# Contributing

Thanks for helping improve Bang Game.

## Development

1. Fork or clone the repository.
2. Install dependencies with `npm install`.
3. Run the development server with `npm run dev`.
4. Run the checks before opening a pull request:
   - `npm run typecheck`
   - `npm test`
   - `npm run build`

## Pull requests

- Keep changes focused and explain the user-visible or engineering impact.
- Preserve existing game rules unless the change intentionally modifies them.
- Add or extend engine tests when changing game mechanics, card interactions, distance/range rules, role logic, or bot behavior.
- Do not commit secrets, local environment files, generated build output, or dependency directories.

## Reporting bugs

Please include reproduction steps, expected behavior, actual behavior, and relevant logs or screenshots. For security issues, use `SECURITY.md` instead of opening a public issue.
