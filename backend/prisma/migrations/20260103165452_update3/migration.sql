/*
  Warnings:

  - The values [WEEKLY] on the enum `BillingCycle` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillingCycle_new" AS ENUM ('MONTHLY', 'YEARLY');
ALTER TABLE "tier_pricing" ALTER COLUMN "billingCycle" TYPE "BillingCycle_new" USING ("billingCycle"::text::"BillingCycle_new");
ALTER TABLE "host_subscriptions" ALTER COLUMN "billingCycle" TYPE "BillingCycle_new" USING ("billingCycle"::text::"BillingCycle_new");
ALTER TYPE "BillingCycle" RENAME TO "BillingCycle_old";
ALTER TYPE "BillingCycle_new" RENAME TO "BillingCycle";
DROP TYPE "public"."BillingCycle_old";
COMMIT;
