-- CreateEnum
CREATE TYPE "TierType" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'PAUSED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('ESEWA', 'KHALTI', 'DODO', 'MANUAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NPR', 'USD', 'INR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentTier" "TierType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "tierExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "host_tiers" (
    "id" SERIAL NOT NULL,
    "name" "TierType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "maxListings" INTEGER NOT NULL DEFAULT 2,
    "maxPhotosPerListing" INTEGER NOT NULL DEFAULT 5,
    "maxBlogPostsPerMonth" INTEGER NOT NULL DEFAULT 2,
    "featuredListingSlots" INTEGER NOT NULL DEFAULT 0,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "features" JSONB,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_pricing" (
    "id" SERIAL NOT NULL,
    "tierId" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'NPR',
    "price" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_subscriptions" (
    "id" SERIAL NOT NULL,
    "hostId" INTEGER NOT NULL,
    "tierId" INTEGER NOT NULL,
    "billingCycle" "BillingCycle",
    "currency" "Currency" NOT NULL DEFAULT 'NPR',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "fromTier" "TierType",
    "toTier" "TierType",
    "details" JSONB,
    "changedBy" INTEGER,
    "changedByType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER,
    "hostId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'NPR',
    "gateway" "PaymentGatewayType" NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayResponse" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DOUBLE PRECISION,
    "refundReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_configs" (
    "id" SERIAL NOT NULL,
    "gateway" "PaymentGatewayType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "merchantId" TEXT,
    "secretKey" TEXT,
    "publicKey" TEXT,
    "baseUrl" TEXT,
    "callbackUrl" TEXT,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "currencies" "Currency"[] DEFAULT ARRAY['NPR']::"Currency"[],
    "countries" TEXT[] DEFAULT ARRAY['NP']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "editableBy" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_tiers_name_key" ON "host_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tier_pricing_tierId_billingCycle_currency_key" ON "tier_pricing"("tierId", "billingCycle", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "host_subscriptions_hostId_key" ON "host_subscriptions"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_configs_gateway_key" ON "payment_gateway_configs"("gateway");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- AddForeignKey
ALTER TABLE "tier_pricing" ADD CONSTRAINT "tier_pricing_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "host_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_subscriptions" ADD CONSTRAINT "host_subscriptions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_subscriptions" ADD CONSTRAINT "host_subscriptions_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "host_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "host_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "host_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
