-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentDetails" JSONB,
ADD COLUMN     "paymentGateway" TEXT,
ADD COLUMN     "paymentReferenceId" TEXT,
ADD COLUMN     "paymentTransactionId" TEXT;
