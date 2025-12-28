/*
  Warnings:

  - You are about to drop the column `fullDayDiscount` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `fullDayHours` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `fullDayRate` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `halfDayDiscount` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `halfDayHours` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `halfDayRate` on the `Listing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "fullDayDiscount",
DROP COLUMN "fullDayHours",
DROP COLUMN "fullDayRate",
DROP COLUMN "halfDayDiscount",
DROP COLUMN "halfDayHours",
DROP COLUMN "halfDayRate",
ADD COLUMN     "durationDiscounts" JSONB;
