-- CreateTable
CREATE TABLE "SetupChannels" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "textChannelId" TEXT NOT NULL,
    "voiceChannelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupChannels_pkey" PRIMARY KEY ("id")
);
