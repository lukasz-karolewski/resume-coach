This is LLM agent powered app to help users edit their resumes/CVs. Below are the coding guidelines to follow when contributing to this project.

# tech stack
next 16
react 19
tailwind 4
vitest 4
better-auth

make sure to use latest api of the frameworks/libraries, if your not familiar with latest api, use context7

<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# General
- always apply general coding best practices for the framework you're working with 
- have a bias towards DRY (don't repeat yourself) principle
- write clean, readable, and maintainable code
- when you see code that can be improved, refactored, or simplified, do it.
- always write tests to check your work.
- when i report an issue make sure to first write a check, make sure it fails, then fix the issue and make sure the check passes.

# Linting and Testing Guidelines
- do not fix linting issues yourself use `pnpm lint:fix` to fix them automatically and run it after all code generation

when you see lint/suspicious/noArrayIndexKey, sometimes it is justified to use array index as a key, but think twice before doing it. add a comment disabling check for this line and explaining why it is safe in this case.

always write unit tests for any new code you add or for any code you modify. Use vitest as the testing framework. run the tests using pnpm test.

when you modify prisma schema, generate the new prisma client by running pnpm exec prisma generate.

never start a dev server yourself using pnpm dev, i will always have it started for you in auto-reload mode.
