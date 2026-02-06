-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "listing_stories" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "establishedYear" INTEGER,
    "tagline" VARCHAR(150),
    "storyTitle" VARCHAR(200),
    "storyContent" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamMembers" JSONB,
    "hostMessage" TEXT,
    "videoUrl" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "moderatedBy" INTEGER,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "listing_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_stories_listingId_key" ON "listing_stories"("listingId");

-- CreateIndex
CREATE INDEX "listing_stories_listingId_idx" ON "listing_stories"("listingId");

-- CreateIndex
CREATE INDEX "listing_stories_status_idx" ON "listing_stories"("status");

-- AddForeignKey
ALTER TABLE "listing_stories" ADD CONSTRAINT "listing_stories_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
