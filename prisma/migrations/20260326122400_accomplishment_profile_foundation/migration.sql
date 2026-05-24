-- CreateTable
CREATE TABLE "AccomplishmentProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccomplishmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccomplishmentRole" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccomplishmentRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccomplishmentEntry" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccomplishmentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccomplishmentProfile_userId_key" ON "AccomplishmentProfile"("userId");

-- CreateIndex
CREATE INDEX "AccomplishmentRole_profileId_idx" ON "AccomplishmentRole"("profileId");

-- CreateIndex
CREATE INDEX "AccomplishmentRole_profileId_sortOrder_idx" ON "AccomplishmentRole"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "AccomplishmentEntry_roleId_idx" ON "AccomplishmentEntry"("roleId");

-- CreateIndex
CREATE INDEX "AccomplishmentEntry_roleId_sortOrder_idx" ON "AccomplishmentEntry"("roleId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AccomplishmentProfile" ADD CONSTRAINT "AccomplishmentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccomplishmentRole" ADD CONSTRAINT "AccomplishmentRole_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AccomplishmentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccomplishmentEntry" ADD CONSTRAINT "AccomplishmentEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccomplishmentRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
