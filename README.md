# Resume Coach - AI Resume Builder

TODO:

- print improvements

  - explore https://pagedjs.org/documentation/5-web-design-for-print/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/orphans
  - https://developer.mozilla.org/en-US/docs/Web/CSS/widows

LLM tactics:

- https://webcache.googleusercontent.com/search?q=cache:https://towardsdatascience.com/how-i-won-singapores-gpt-4-prompt-engineering-competition-34c195a93d41
- https://github.com/microsoft/LLMLingua


npm init playwright@latest --yes "--" . '--quiet' '--browser=chromium' '--browser=firefox' '--browser=webkit' '--gha' '--install-deps'

  npx playwright test
    Runs the end-to-end tests.

  npx playwright test --ui
    Starts the interactive UI mode.

  npx playwright test --project=chromium
    Runs the tests only on Desktop Chrome.

  npx playwright test example
    Runs the tests in a specific file.

  npx playwright test --debug
    Runs the tests in debug mode.

  npx playwright codegen
    Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test

And check out the following files:
  - ./tests/example.spec.ts - Example end-to-end test
  - ./playwright.config.ts - Playwright Test configuration

Visit https://playwright.dev/docs/intro for more information. ✨