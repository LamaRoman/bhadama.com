/*
  Warnings:

  - A unique constraint covering the columns `[date,metric]` on the table `PlatformMetric` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BlockedDate" ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "autoConfirm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instantBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxAdvanceBooking" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "minAdvanceBooking" INTEGER NOT NULL DEFAULT 24;

-- CreateTable
CREATE TABLE "SpecialPricing" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialPricing_listingId_idx" ON "SpecialPricing"("listingId");

-- CreateIndex
CREATE INDEX "SpecialPricing_date_idx" ON "SpecialPricing"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialPricing_listingId_date_key" ON "SpecialPricing"("listingId", "date");

-- CreateIndex
CREATE INDEX "AbuseReport_resolved_idx" ON "AbuseReport"("resolved");

-- CreateIndex
CREATE INDEX "Analytics_listingId_idx" ON "Analytics"("listingId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "BlockedDate_listingId_idx" ON "BlockedDate"("listingId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");

-- CreateIndex
CREATE INDEX "Listing_isFeatured_idx" ON "Listing"("isFeatured");

-- CreateIndex
CREATE INDEX "Listing_discountPercent_idx" ON "Listing"("discountPercent");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_read_idx" ON "Message"("read");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetric_date_metric_key" ON "PlatformMetric"("date", "metric");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "SavedListing_userId_idx" ON "SavedListing"("userId");

-- AddForeignKey
ALTER TABLE "SpecialPricing" ADD CONSTRAINT "SpecialPricing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
