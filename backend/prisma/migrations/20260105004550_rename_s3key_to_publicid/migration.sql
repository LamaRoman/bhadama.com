/*
  Warnings:

  - You are about to drop the column `s3Key` on the `Image` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "BillingCycle" ADD VALUE 'WEEKLY';

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "s3Key",
ADD COLUMN     "publicId" TEXT;
