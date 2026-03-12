-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'REVIEWED');

-- CreateTable
CREATE TABLE "IncidentUpload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "incidentCount" INTEGER NOT NULL,
    "originalJson" TEXT NOT NULL,
    "reviewedJson" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentUpload_pkey" PRIMARY KEY ("id")
);
