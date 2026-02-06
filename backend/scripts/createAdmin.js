// ============================================
// FILE: backend/scripts/createAdmin.js
// ACTION: UPDATED - Production-Safe Admin Creation
// ============================================
// 
// Creates admin/super admin users safely for both local and production.
//
// LOCAL USAGE (Interactive):
//   node scripts/createAdmin.js
//
// PRODUCTION USAGE (Environment Variables):
//   ADMIN_EMAIL=admin@mybigyard.com ADMIN_PASSWORD=SecurePass123! node scripts/createAdmin.js
//
// RAILWAY USAGE:
//   railway run node scripts/createAdmin.js
//

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  console.log("\n🔐 Admin User Creation Script");
  console.log("================================\n");

  try {
    // Check if running in interactive mode (no env vars)
    const isInteractive = !process.env.ADMIN_EMAIL && process.stdin.isTTY;

    let adminData;

    if (isInteractive) {
      // ============================================
      // INTERACTIVE MODE (Local Development)
      // ============================================
      console.log("📝 Interactive Mode - Please provide admin details:\n");

      // Check if any super admin exists
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { 
          role: "ADMIN",
          adminRole: "SUPER_ADMIN"
        }
      });

      if (existingSuperAdmin) {
        console.log("⚠️  A super admin already exists:");
        console.log(`   Email: ${existingSuperAdmin.email}`);
        console.log(`   Name: ${existingSuperAdmin.name}\n`);
        
        const createAnother = await question("Create another admin anyway? (yes/no): ");
        
        if (createAnother.toLowerCase() !== "yes") {
          console.log("\n❌ Cancelled\n");
          rl.close();
          return;
        }
      }

      // Collect admin information
      const name = await question("Enter name: ");
      const email = await question("Enter email: ");
      const password = await question("Enter password (min 12 chars): ");
      const confirmPassword = await question("Confirm password: ");
      const phone = await question("Enter phone (optional, press enter to skip): ");
      
      console.log("\nSelect admin role:");
      console.log("1. SUPER_ADMIN (Full system access)");
      console.log("2. MODERATOR (Content moderation)");
      console.log("3. SUPPORT (Customer support)");
      console.log("4. ANALYST (Analytics & reports)");
      const roleChoice = await question("Enter choice (1-4, default: 1): ");

      const adminRoleMap = {
        "1": "SUPER_ADMIN",
        "2": "MODERATOR",
        "3": "SUPPORT",
        "4": "ANALYST",
      };
      const adminRole = adminRoleMap[roleChoice] || "SUPER_ADMIN";

      // Validate input
      if (!name || name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
      }

      if (!email || !email.includes("@")) {
        throw new Error("Invalid email address");
      }

      if (password.length < 12) {
        throw new Error("Password must be at least 12 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      adminData = {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || null,
        adminRole,
      };

      rl.close();

    } else {
      // ============================================
      // AUTOMATED MODE (Production/Railway)
      // ============================================
      console.log("🤖 Automated Mode - Using environment variables\n");

      adminData = {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        name: process.env.ADMIN_NAME || "System Admin",
        phone: process.env.ADMIN_PHONE || null,
        adminRole: process.env.ADMIN_ROLE || "SUPER_ADMIN",
      };

      // Validate required env vars
      if (!adminData.email || !adminData.password) {
        console.log("⚠️  Skipping admin creation - credentials not set");
        console.log("   Required: ADMIN_EMAIL and ADMIN_PASSWORD");
        console.log("   Optional: ADMIN_NAME, ADMIN_PHONE, ADMIN_ROLE\n");
        return;
      }

      // Validate password strength
      if (adminData.password.length < 12) {
        throw new Error("ADMIN_PASSWORD must be at least 12 characters");
      }

      // Check if super admin already exists
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { 
          role: "ADMIN",
          adminRole: "SUPER_ADMIN"
        }
      });

      if (existingSuperAdmin) {
        console.log("✅ Super admin already exists. Skipping creation.");
        console.log(`   Email: ${existingSuperAdmin.email}\n`);
        return;
      }
    }

    // ============================================
    // CREATE OR UPGRADE ADMIN
    // ============================================

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      // Upgrade existing user to admin
      const updated = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          role: "ADMIN",
          adminRole: adminData.adminRole,
          emailVerified: true,
        }
      });

      console.log("✅ Existing user upgraded to admin!\n");
      console.log("   Details:");
      console.log("   ─────────────────────────────");
      console.log(`   Email:      ${updated.email}`);
      console.log(`   Name:       ${updated.name}`);
      console.log(`   Role:       ${updated.role}`);
      console.log(`   Admin Role: ${updated.adminRole}`);
      console.log("   ─────────────────────────────\n");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        phone: adminData.phone,
        role: "ADMIN",
        adminRole: adminData.adminRole,
        emailVerified: true,
        lastPasswordChange: new Date(),
      }
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("   Details:");
    console.log("   ─────────────────────────────");
    console.log(`   Email:      ${admin.email}`);
    console.log(`   Password:   ${isInteractive ? adminData.password : '***hidden***'}`);
    console.log(`   Name:       ${admin.name}`);
    console.log(`   Role:       ${admin.role}`);
    console.log(`   Admin Role: ${admin.adminRole}`);
    if (admin.phone) {
      console.log(`   Phone:      ${admin.phone}`);
    }
    console.log("   ─────────────────────────────\n");

    // Security warnings
    console.log("⚠️  SECURITY REMINDERS:");
    console.log("   1. Change the password immediately after first login");
    console.log("   2. If using env vars, DELETE them after creation:");
    console.log("      - ADMIN_EMAIL");
    console.log("      - ADMIN_PASSWORD");
    console.log("      - ADMIN_NAME, ADMIN_PHONE, ADMIN_ROLE");
    console.log("   3. Never commit real credentials to git");
    console.log("   4. These credentials will NOT be shown again\n");

  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    
    if (error.code === "P2002") {
      console.log("\n   A user with this email already exists.");
    }
    
    rl.close();
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();