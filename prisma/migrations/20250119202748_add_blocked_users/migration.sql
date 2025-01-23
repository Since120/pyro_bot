-- AlterTable
ALTER TABLE "DynamicVoiceChannel" ADD COLUMN     "blockedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];
