-- Better Auth rejects ambiguous account identities. Stop the migration before
-- changing OAuth state if the existing provider/account keys need repair.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "account"
    GROUP BY "providerId", "accountId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Better Auth provider/account identity detected';
  END IF;
END $$;

-- Resume Coach uses OAuth clients only for MCP. Better Auth 1.7 requires
-- resource-bound clients, so existing connectors must re-register after the
-- upgrade. The foreign keys cascade this deletion to their tokens and consents.
DELETE FROM "oauthClient";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "oauthRefreshToken")
    OR EXISTS (SELECT 1 FROM "oauthAccessToken")
    OR EXISTS (SELECT 1 FROM "oauthConsent") THEN
    RAISE EXCEPTION 'Legacy MCP OAuth grants remain after client purge';
  END IF;
END $$;

ALTER TABLE "jwks"
ADD COLUMN "alg" TEXT,
ADD COLUMN "crv" TEXT;

ALTER TABLE "oauthClient"
DROP COLUMN "public",
DROP COLUMN "type",
ADD COLUMN "applicationType" TEXT,
ADD COLUMN "backchannelLogoutSessionRequired" BOOLEAN,
ADD COLUMN "backchannelLogoutUri" TEXT,
ADD COLUMN "clientCredentialsScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "clientDiscoveryId" TEXT,
ADD COLUMN "dpopBoundAccessTokens" BOOLEAN DEFAULT false,
ADD COLUMN "jwks" TEXT,
ADD COLUMN "jwksUri" TEXT;

ALTER TABLE "oauthRefreshToken"
ADD COLUMN "authorizationCodeId" TEXT,
ADD COLUMN "confirmation" JSONB,
ADD COLUMN "requestedUserInfoClaims" TEXT[],
ADD COLUMN "resources" TEXT[],
ADD COLUMN "rotatedAt" TIMESTAMP(3),
ADD COLUMN "rotationReplayExpiresAt" TIMESTAMP(3),
ADD COLUMN "rotationReplayResponse" TEXT,
ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;

ALTER TABLE "oauthAccessToken"
ADD COLUMN "authorizationCodeId" TEXT,
ADD COLUMN "confirmation" JSONB,
ADD COLUMN "requestedUserInfoClaims" TEXT[],
ADD COLUMN "resources" TEXT[],
ADD COLUMN "revoked" TIMESTAMP(3),
ALTER COLUMN "token" SET NOT NULL,
ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;

ALTER TABLE "oauthConsent"
ADD COLUMN "requestedUserInfoClaims" TEXT[],
ADD COLUMN "resources" TEXT[],
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TABLE "oauthResource" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accessTokenTtl" INTEGER,
  "refreshTokenTtl" INTEGER,
  "signingAlgorithm" TEXT,
  "signingKeyId" TEXT,
  "allowedScopes" TEXT[],
  "customClaims" JSONB,
  "dpopBoundAccessTokensRequired" BOOLEAN DEFAULT false,
  "disabled" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "policyVersion" INTEGER DEFAULT 1,
  "metadata" JSONB,

  CONSTRAINT "oauthResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauthClientResource" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3),

  CONSTRAINT "oauthClientResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauthClientAssertion" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "oauthClientAssertion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauthResource_identifier_key"
ON "oauthResource"("identifier");

CREATE INDEX "oauthClientResource_clientId_idx"
ON "oauthClientResource"("clientId");

CREATE INDEX "oauthClientResource_resourceId_idx"
ON "oauthClientResource"("resourceId");

CREATE UNIQUE INDEX "oauthClientResource_clientId_resourceId_uidx"
ON "oauthClientResource"("clientId", "resourceId");

CREATE INDEX "oauthRefreshToken_authorizationCodeId_idx"
ON "oauthRefreshToken"("authorizationCodeId");

CREATE INDEX "oauthAccessToken_authorizationCodeId_idx"
ON "oauthAccessToken"("authorizationCodeId");

ALTER TABLE "oauthClientResource"
ADD CONSTRAINT "oauthClientResource_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "oauthClient"("clientId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oauthClientResource"
ADD CONSTRAINT "oauthClientResource_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "oauthResource"("identifier")
ON DELETE CASCADE ON UPDATE CASCADE;
