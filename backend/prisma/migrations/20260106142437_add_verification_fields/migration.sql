/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailOtpResetTime" TIMESTAMP(3),
ADD COLUMN     "emailOtpSendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerificationLockedUntil" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "lastEmailOtpSent" TIMESTAMP(3),
ADD COLUMN     "lastPhoneOtpSent" TIMESTAMP(3),
ADD COLUMN     "phoneCountryCode" TEXT,
ADD COLUMN     "phoneOtpResetTime" TIMESTAMP(3),
ADD COLUMN     "phoneOtpSendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "phoneVerificationLockedUntil" TIMESTAMP(3),
ADD COLUMN     "phoneVerificationToken" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
