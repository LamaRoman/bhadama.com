-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "bonusHoursOffer" JSONB,
ADD COLUMN     "fullDayDiscount" INTEGER,
ADD COLUMN     "fullDayHours" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "fullDayRate" DECIMAL(10,2),
ADD COLUMN     "halfDayDiscount" INTEGER,
ADD COLUMN     "halfDayHours" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "halfDayRate" DECIMAL(10,2);
