// ============================================
// PAYMENT GATEWAY SEED
// ============================================
// Run this to set up payment gateway configurations
// File: prisma/seed-gateways.js
// 
// Usage: node prisma/seed-gateways.js
// ============================================
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedPaymentGateways() {
  console.log("🌱 Seeding payment gateway configurations...\n");

  // eSewa Configuration
  const esewa = await prisma.paymentGatewayConfig.upsert({
    where: { gateway: "ESEWA" },
    update: {
      displayName: "eSewa",
      merchantId: "EPAYTEST",
      secretKey: "8gBm/:&EnhH.1/q",
      isActive: true,
      isTestMode: true,
      currencies: ["NPR"],
      countries: ["NP"],
    },
    create: {
      gateway: "ESEWA",
      displayName: "eSewa",
      merchantId: "EPAYTEST",
      secretKey: "8gBm/:&EnhH.1/q",
      isActive: true,
      isTestMode: true,
      currencies: ["NPR"],
      countries: ["NP"],
    },
  });
  console.log("✅ eSewa configured:", esewa.gateway);

  // Khalti Configuration
  const khalti = await prisma.paymentGatewayConfig.upsert({
    where: { gateway: "KHALTI" },
    update: {
      displayName: "Khalti",
      secretKey: "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b", // ✅ Real Khalti test key
      publicKey: "test_public_key_dc74e0fd57cb46cd93832aee0a390234", // ✅ Real Khalti public key
      isActive: true,
      isTestMode: true,
      currencies: ["NPR"],
      countries: ["NP"],
    },
    create: {
      gateway: "KHALTI",
      displayName: "Khalti",
      secretKey: "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b",
      publicKey: "test_public_key_dc74e0fd57cb46cd93832aee0a390234",
      isActive: true,
      isTestMode: true,
      currencies: ["NPR"],
      countries: ["NP"],
    },
  });
  console.log("✅ Khalti configured:", khalti.gateway);

  // Dodo (Card Payments) Configuration
  const dodo = await prisma.paymentGatewayConfig.upsert({
    where: { gateway: "DODO" },
    update: {
      displayName: "Card Payment",
      secretKey: "sk_test_mock_key", // ✅ Mock key for testing
      publicKey: "pk_test_mock_key",
      baseUrl: "https://test.dodopayments.com",
      isActive: true,
      isTestMode: true,
      currencies: ["USD", "NPR"],
      countries: ["*"],
    },
    create: {
      gateway: "DODO",
      displayName: "Card Payment",
      secretKey: "sk_test_mock_key",
      publicKey: "pk_test_mock_key",
      baseUrl: "https://test.dodopayments.com",
      isActive: true,
      isTestMode: true,
      currencies: ["USD", "NPR"],
      countries: ["*"],
    },
  });
  console.log("✅ Dodo (Card) configured:", dodo.gateway);

  console.log("\n🎉 Payment gateway seeding complete!");
  console.log("\n📝 Remember to update the keys for production:");
  console.log("   - eSewa: Get merchant ID from https://merchant.esewa.com.np");
  console.log("   - Khalti: Get keys from https://admin.khalti.com");
  console.log("   - Dodo: Get keys from https://dashboard.dodopayments.com");
}

seedPaymentGateways()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });