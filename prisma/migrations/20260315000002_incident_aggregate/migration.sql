-- CreateTable
CREATE TABLE "IncidentAggregate" (
    "id" TEXT NOT NULL,
    "aggregatedJson" TEXT NOT NULL,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentAggregate_pkey" PRIMARY KEY ("id")
);
