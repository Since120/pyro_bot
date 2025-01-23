-- AlterTable
ALTER TABLE "DynamicVoiceChannel" ADD COLUMN     "allowedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];
