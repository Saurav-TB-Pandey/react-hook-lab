# Contributing to react-hook-lab

First off, thank you for considering contributing to `react-hook-lab`! It's people like you that make open-source such a great community.

## 1. Local Setup

To get the repository set up on your local machine:

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-hook-lab.git
   cd react-hook-lab
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## 2. Development Workflow

We use TypeScript, ESLint, and Prettier to ensure a consistent, high-quality codebase.

### Scripts
- **Format Code**: `npm run format` (Automatically formats all source code using Prettier)
- **Lint Code**: `npm run lint` (Checks for ESLint rule violations)
- **Typecheck**: `npm run typecheck` (Ensures there are no TypeScript errors)
- **Test**: `npm test` (Runs the test suite)
- **Build**: `npm run build` (Compiles the project)

### Adding a new Hook
If you are contributing a new hook:
1. Place it in the appropriate subfolder inside `src/` (e.g., `src/async/`, `src/dom/`).
2. Ensure you export it from the `index.ts` file in that folder, as well as the root `src/index.ts`.
3. Add a test case in `test.js` to ensure the hook behaves properly.
4. Add documentation for the hook in the `README.md`.

## 3. Submitting a Pull Request

1. Create a new branch for your feature/fix (`git checkout -b feature/my-new-hook`).
2. Ensure all tests and linting checks pass:
   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npm test
   ```
3. Commit your changes with a descriptive commit message.
4. Push to your fork and submit a Pull Request.

Our GitHub Actions will automatically run the tests and linter against your Pull Request. If everything passes, a maintainer will review your code!
