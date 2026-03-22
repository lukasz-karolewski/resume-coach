import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("auth integration", () => {
  it("keeps Better Auth explicitly wired to Prisma and stable URL settings", () => {
    const authSource = readFileSync(
      resolve(import.meta.dirname, "./auth.ts"),
      "utf8",
    );

    expect(authSource).toContain(
      'import { prismaAdapter } from "better-auth/adapters/prisma"',
    );
    expect(authSource).toContain("database: prismaAdapter(db, {");
    expect(authSource).toContain('provider: "sqlite"');
    expect(authSource).toContain("secret: env.BETTER_AUTH_SECRET");
    expect(authSource).toContain("baseURL:");
    expect(authSource).toContain("basePath:");
    expect(authSource).toContain("trustedOrigins:");
  });

  it("keeps the Prisma auth models aligned with Better Auth indexes", () => {
    const schemaSource = readFileSync(
      resolve(import.meta.dirname, "../prisma/schema.prisma"),
      "utf8",
    );

    expect(schemaSource).toMatch(/model Session[\s\S]*@@index\(\[userId\]\)/);
    expect(schemaSource).toMatch(/model Account[\s\S]*@@index\(\[userId\]\)/);
    expect(schemaSource).toMatch(
      /model Verification[\s\S]*@@index\(\[identifier\]\)/,
    );
  });
});
