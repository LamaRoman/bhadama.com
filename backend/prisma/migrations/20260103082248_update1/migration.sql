-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL', 'PRORATED', 'RENEWAL', 'MANUAL', 'REFUND');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ListingStatus" ADD VALUE 'OVER_LIMIT';
ALTER TYPE "ListingStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedReason" TEXT,
ADD COLUMN     "previousStatus" "ListingStatus";

-- AlterTable
ALTER TABLE "host_subscriptions" ADD COLUMN     "excessListingsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "listingSelectionDeadline" TIMESTAMP(3),
ADD COLUMN     "pendingTierId" INTEGER,
ADD COLUMN     "previousTierId" INTEGER,
ADD COLUMN     "tierChangeScheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "originalAmount" DOUBLE PRECISION,
ADD COLUMN     "proratedCredit" DOUBLE PRECISION,
ADD COLUMN     "type" "PaymentType" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "upgradeFromTierId" INTEGER;

-- AddForeignKey
ALTER TABLE "host_subscriptions" ADD CONSTRAINT "host_subscriptions_previousTierId_fkey" FOREIGN KEY ("previousTierId") REFERENCES "host_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_subscriptions" ADD CONSTRAINT "host_subscriptions_pendingTierId_fkey" FOREIGN KEY ("pendingTierId") REFERENCES "host_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
