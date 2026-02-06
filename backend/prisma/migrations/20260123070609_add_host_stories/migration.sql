/*
  Warnings:

  - You are about to drop the column `listingId` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the `listing_stories` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'HOST_STORY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'HOST_STORY_REJECTED';

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_listingId_fkey";

-- DropForeignKey
ALTER TABLE "listing_stories" DROP CONSTRAINT "listing_stories_listingId_fkey";

-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "listingId";

-- DropTable
DROP TABLE "listing_stories";

-- CreateTable
CREATE TABLE "host_stories" (
    "id" SERIAL NOT NULL,
    "hostId" INTEGER NOT NULL,
    "hostingSince" INTEGER,
    "tagline" VARCHAR(150),
    "storyTitle" VARCHAR(200),
    "storyContent" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funFacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hostMessage" TEXT,
    "videoUrl" TEXT,
    "coverImage" TEXT,
    "coverImagePublicId" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "moderatedBy" INTEGER,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "host_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_stories_hostId_key" ON "host_stories"("hostId");

-- CreateIndex
CREATE INDEX "host_stories_hostId_idx" ON "host_stories"("hostId");

-- CreateIndex
CREATE INDEX "host_stories_status_idx" ON "host_stories"("status");

-- AddForeignKey
ALTER TABLE "host_stories" ADD CONSTRAINT "host_stories_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
