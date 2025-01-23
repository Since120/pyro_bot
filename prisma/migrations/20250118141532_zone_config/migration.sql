-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "zoneKey" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "minutesRequired" INTEGER NOT NULL DEFAULT 60,
    "pointsGranted" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_zoneKey_key" ON "Zone"("zoneKey");
