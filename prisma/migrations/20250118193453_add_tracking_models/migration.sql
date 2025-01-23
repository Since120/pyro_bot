-- CreateTable
CREATE TABLE "DynamicVoiceChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "zoneKey" TEXT,
    "createdByUser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicVoiceChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTracked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleConfig" (
    "id" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicVoiceChannel_channelId_key" ON "DynamicVoiceChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTracking_userId_key" ON "UserTracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_roleKey" ON "RoleConfig"("roleKey");
