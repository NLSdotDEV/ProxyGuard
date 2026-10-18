# ProxyGuard

TypeScript project generated with [launchts](https://github.com/Jszigeti/launchts).

## Getting Started
### Development

```bash
npm run build   # build
npm run dev     # dev
npm run lint    # lint
npm run format  # format
```
### Project Structure

```
ProxyGuard/
├── src/
│   └── index.ts       # Entry point
├── dist/              # Compiled output (generated)
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies and scripts
├── eslint.config.js   # ESLint configuration (flat config)
├── .prettierrc        # Prettier configuration
└── ...
```
## Technology Stack

- **TypeScript** - Type-safe JavaScript with ESNext target
- **Node.js** - Runtime environment with ESM modules
- **ESLint** - Code quality and consistency with TypeScript support
- **Prettier** - Code formatting
- **Nodemon** - Auto-reload during development

## Scripts

- `npm run build` - Compiles TypeScript files to JavaScript in the `dist/` directory
- `npm run dev` - Starts the development server with auto-reload on file changes
- `npm run lint` - Checks code quality with ESLint
- `npm run format` - Formats all files with Prettier

## License

MIT
