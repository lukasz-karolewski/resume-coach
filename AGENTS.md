This is LLM agent powered app to help users edit their resumes/CVs. Below are the coding guidelines to follow when contributing to this project.

# tech stack
next 16
react 19
tailwind 4
vitest 4

# General
- always apply general coding best practices for the framework you're working with 
- have a bias towards DRY (don't repeat yourself) principle
- write clean, readable, and maintainable code
- when you see code that can be improved, refactored, or simplified, do it.
- always write tests to check your work.
- when i report an issue make sure to first write a check, make sure it fails, then fix the issue and make sure the check passes.

# Linting and Testing Guidelines
- do not fix linting issues yourself use npm run lint:fix to fix them automatically.
when you see lint/suspicious/noArrayIndexKey, sometimes it is justified to use array index as a key, but think twice before doing it. add a comment disabling check for this line and explaining why it is safe in this case.

always write unit tests for any new code you add or for any code you modify. Use vitest as the testing framework. run the tests using npm run test.

when you modify prisma schema, generate the new prisma client by running npx prisma generate.

never start a dev server yourself using npm run dev, i will always have it started for you in auto-reload mode.