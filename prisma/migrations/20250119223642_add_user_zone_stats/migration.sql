-- CreateTable
CREATE TABLE "UserZoneStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneKey" TEXT NOT NULL,
    "totalSecondsInZone" INTEGER NOT NULL DEFAULT 0,
    "leftoverSeconds" INTEGER NOT NULL DEFAULT 0,
    "pointsInThisZone" INTEGER NOT NULL DEFAULT 0,
    "lastJoinTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserZoneStats_pkey" PRIMARY KEY ("id")
);
