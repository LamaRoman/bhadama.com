-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentDetails" JSONB,
ADD COLUMN     "paymentGateway" TEXT,
ADD COLUMN     "paymentReferenceId" TEXT,
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "paymentTransactionId" TEXT;
