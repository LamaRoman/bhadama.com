// ==========================================
// ROLE SYSTEM DIAGNOSTIC & TEST UTILITIES
// ==========================================
// File: utils/role-diagnostics.js
//
// Test and verify your role system setup
// ==========================================

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  ROLE_HIERARCHY,
  ADMIN_HIERARCHY,
  PERMISSIONS,
  STRICT_ROLE_OPERATIONS,
  isSuperAdmin,
  isAdmin,
  hasAdminRole,
  hasAdminLevel,
  hasPermission,
  canPerformStrictOperation,
  getEffectiveAdminRoles,
  getRoleName,
  canSuperAdminBypass,
  isGodModeEnabled,
} from "../config/roles.config.js";

const prisma = new PrismaClient();

// ==========================================
// DIAGNOSTIC FUNCTIONS
// ==========================================

/**
 * Check user's role configuration in database
 */
export async function diagnoseUserRole(email) {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 ROLE SYSTEM DIAGNOSTIC");
  console.log("=".repeat(60));
  console.log(`Email: ${email}\n`);

  try {
    // 1. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminRole: true,
        suspended: true,
        lockedUntil: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      console.log("❌ User not found in database\n");
      return null;
    }

    // 2. Display user info
    console.log("📋 USER INFORMATION");
    console.log("-".repeat(60));
    console.log(`   ID:                ${user.id}`);
    console.log(`   Email:             ${user.email}`);
    console.log(`   Name:              ${user.name}`);
    console.log(`   Primary Role:      ${user.role} (Level ${ROLE_HIERARCHY[user.role] || 0})`);
    console.log(`   Admin Role:        ${user.adminRole || '(none)'} ${user.adminRole ? `(Level ${ADMIN_HIERARCHY[user.adminRole] || 0})` : ''}`);
    console.log(`   Suspended:         ${user.suspended ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Email Verified:    ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Phone Verified:    ${user.phoneVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   2FA Enabled:       ${user.twoFactorEnabled ? '✅ Yes' : '❌ No'}`);
    console.log();

    // 3. Role checks
    console.log("🔐 ROLE STATUS");
    console.log("-".repeat(60));
    console.log(`   Is Admin:          ${isAdmin(user) ? '✅ YES' : '❌ No'}`);
    console.log(`   Is Super Admin:    ${isSuperAdmin(user) ? '✅ YES' : '❌ No'}`);
    console.log(`   Display Name:      "${getRoleName(user.role, user.adminRole)}"`);
    console.log();

    // 4. Effective roles (via hierarchy)
    if (user.adminRole) {
      const effectiveRoles = getEffectiveAdminRoles(user);
      console.log("📊 EFFECTIVE ADMIN ROLES (via hierarchy)");
      console.log("-".repeat(60));
      console.log(`   ${effectiveRoles.join(', ')}`);
      console.log();
    }

    // 5. Permission checks
    console.log("🎫 PERMISSION CHECKS");
    console.log("-".repeat(60));
    const samplePermissions = [
      'users.view',
      'users.edit',
      'users.delete',
      'refunds.process',
      'payouts.manage',
      'analytics.view',
      'system.config',
    ];

    samplePermissions.forEach(perm => {
      const has = hasPermission(user, perm);
      console.log(`   ${perm.padEnd(25)} ${has ? '✅' : '❌'}`);
    });
    console.log();

    // 6. Strict operations
    console.log("🔒 STRICT OPERATIONS");
    console.log("-".repeat(60));
    const sampleOps = [
      'refund.process',
      'payout.approve',
      'payment.void',
    ];

    sampleOps.forEach(op => {
      const can = canPerformStrictOperation(user, op);
      const allowedRoles = STRICT_ROLE_OPERATIONS[op] || [];
      console.log(`   ${op.padEnd(25)} ${can ? '✅' : '❌'}  (Requires: ${allowedRoles.join(', ')})`);
    });
    console.log();

    // 7. Admin level checks
    if (user.adminRole) {
      console.log("📈 ADMIN LEVEL CHECKS");
      console.log("-".repeat(60));
      Object.entries(ADMIN_HIERARCHY).forEach(([role, level]) => {
        const has = hasAdminLevel(user, level);
        console.log(`   Level ${level} (${role.padEnd(12)}) ${has ? '✅' : '❌'}`);
      });
      console.log();
    }

    // 8. Environment configuration
    console.log("⚙️  ENVIRONMENT CONFIGURATION");
    console.log("-".repeat(60));
    console.log(`   God Mode Enabled:  ${isGodModeEnabled() ? '✅ YES (SUPER_ADMIN_GOD_MODE=true)' : '❌ No'}`);
    console.log();

    // 9. Bypass capabilities
    if (isSuperAdmin(user)) {
      console.log("🚀 SUPER ADMIN BYPASS CAPABILITIES");
      console.log("-".repeat(60));
      const bypassChecks = [
        'authorization',
        'ownership',
        'adminRoleRestrictions',
        'emailVerification',
        'phoneVerification',
        'twoFactor',
        'suspension',
        'accountLock',
        'rateLimit',
      ];

      bypassChecks.forEach(check => {
        const can = canSuperAdminBypass(check);
        console.log(`   ${check.padEnd(25)} ${can ? '✅' : '❌'}`);
      });
      console.log();
    }

    // 10. JWT token preview
    const JWT_SECRET = process.env.JWT_SECRET;
    if (JWT_SECRET) {
      console.log("🎫 JWT TOKEN PREVIEW");
      console.log("-".repeat(60));
      const tokenPayload = {
        userId: Number(user.id),
        email: user.email,
        role: user.role,
        adminRole: user.adminRole || null,
        type: "access",
      };
      
      const testToken = jwt.sign(
        tokenPayload,
        JWT_SECRET,
        {
          algorithm: "HS512",
          expiresIn: "15m",
          issuer: "mybigyard.com",
          audience: "mybigyard.com",
        }
      );

      console.log(`   Token Payload:`);
      console.log(JSON.stringify(tokenPayload, null, 6));
      console.log();
      console.log(`   Token (first 60 chars): ${testToken.substring(0, 60)}...`);
      console.log();
      console.log(`   🔗 Decode at: https://jwt.io`);
      console.log();
    }

    // 11. Recommendations
    console.log("💡 RECOMMENDATIONS");
    console.log("-".repeat(60));
    
    if (user.role !== 'ADMIN' && user.adminRole) {
      console.log("   ⚠️  WARNING: Has adminRole but role is not ADMIN");
      console.log(`      Consider: UPDATE "User" SET role = 'ADMIN' WHERE id = ${user.id};`);
    }
    
    if (user.role === 'ADMIN' && !user.adminRole) {
      console.log("   ⚠️  User is ADMIN but has no adminRole specified");
      console.log(`      For super admin: UPDATE "User" SET "adminRole" = 'SUPER_ADMIN' WHERE id = ${user.id};`);
    }

    if (isSuperAdmin(user)) {
      console.log("   ✅ User has SUPER_ADMIN privileges");
      console.log("   ✅ Full access to all endpoints");
      if (isGodModeEnabled()) {
        console.log("   ⚠️  God mode is ENABLED (development)");
        console.log("      Remember to set SUPER_ADMIN_GOD_MODE=false in production!");
      } else {
        console.log("   ✅ God mode is DISABLED (production mode)");
      }
    }

    if (user.suspended) {
      console.log("   ⚠️  Account is suspended");
      if (isSuperAdmin(user) && isGodModeEnabled()) {
        console.log("      But can still access in god mode");
      } else {
        console.log(`      To unsuspend: UPDATE "User" SET suspended = false WHERE id = ${user.id};`);
      }
    }

    if (!user.emailVerified) {
      console.log("   ⚠️  Email not verified");
      if (isSuperAdmin(user) && canSuperAdminBypass('emailVerification')) {
        console.log("      But can bypass in god mode");
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log();

    return user;
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log();
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Test middleware authorization
 */
export function testMiddlewareAuthorization(user, middlewareType, ...args) {
  console.log(`\n🧪 Testing ${middlewareType}(${args.join(', ')})`);
  console.log("-".repeat(60));

  let result = false;
  let reason = '';

  try {
    switch (middlewareType) {
      case 'requireAdmin':
        result = isAdmin(user);
        reason = result ? 'Is admin' : 'Not an admin';
        break;

      case 'requireAdminLevel':
        const minLevel = args[0];
        result = isSuperAdmin(user) || hasAdminLevel(user, minLevel);
        const levelName = Object.keys(ADMIN_HIERARCHY).find(k => ADMIN_HIERARCHY[k] === minLevel);
        reason = result 
          ? `Has admin level ${minLevel} (${levelName}) or higher` 
          : `Needs admin level ${minLevel} (${levelName})`;
        break;

      case 'requireAdminRole':
        const roles = args;
        result = isSuperAdmin(user) || hasAdminRole(user, ...roles);
        reason = result ? `Has role ${roles.join(' or ')}` : `Needs role ${roles.join(' or ')}`;
        break;

      case 'requireSuperAdmin':
        result = isSuperAdmin(user);
        reason = result ? 'Is super admin' : 'Not a super admin';
        break;

      case 'requirePermission':
        const permission = args[0];
        result = hasPermission(user, permission);
        reason = result ? `Has permission '${permission}'` : `Missing permission '${permission}'`;
        break;

      case 'requireStrictOperation':
        const operation = args[0];
        result = canPerformStrictOperation(user, operation);
        reason = result ? `Can perform '${operation}'` : `Cannot perform '${operation}'`;
        break;

      default:
        reason = `Unknown middleware: ${middlewareType}`;
    }

    console.log(`   Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Reason: ${reason}`);
    console.log();

    return result;
  } catch (error) {
    console.log(`   Result: ❌ ERROR`);
    console.log(`   Error:  ${error.message}`);
    console.log();
    return false;
  }
}

/**
 * Run comprehensive test suite
 */
export async function runTestSuite(email) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 COMPREHENSIVE ROLE SYSTEM TEST SUITE");
  console.log("=".repeat(60));
  console.log();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.log("❌ User not found");
    await prisma.$disconnect();
    return;
  }

  const tests = [
    { type: 'requireAdmin', args: [] },
    { type: 'requireAdminLevel', args: [ADMIN_HIERARCHY.SUPPORT] },
    { type: 'requireAdminLevel', args: [ADMIN_HIERARCHY.MODERATOR] },
    { type: 'requireAdminLevel', args: [ADMIN_HIERARCHY.FINANCE] },
    { type: 'requireAdminLevel', args: [ADMIN_HIERARCHY.ANALYST] },
    { type: 'requireAdminLevel', args: [ADMIN_HIERARCHY.SUPER_ADMIN] },
    { type: 'requireAdminRole', args: ['SUPPORT'] },
    { type: 'requireAdminRole', args: ['MODERATOR'] },
    { type: 'requireAdminRole', args: ['FINANCE'] },
    { type: 'requireAdminRole', args: ['ANALYST'] },
    { type: 'requireSuperAdmin', args: [] },
    { type: 'requirePermission', args: ['users.view'] },
    { type: 'requirePermission', args: ['users.delete'] },
    { type: 'requirePermission', args: ['refunds.process'] },
    { type: 'requireStrictOperation', args: ['refund.process'] },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const result = testMiddlewareAuthorization(user, test.type, ...test.args);
    if (result) passed++;
    else failed++;
  });

  console.log("=".repeat(60));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
  console.log();

  await prisma.$disconnect();
}

/**
 * Compare two users' permissions
 */
export async function compareUsers(email1, email2) {
  console.log("\n" + "=".repeat(60));
  console.log("🔄 USER PERMISSION COMPARISON");
  console.log("=".repeat(60));
  console.log();

  const user1 = await prisma.user.findUnique({
    where: { email: email1.toLowerCase() },
  });

  const user2 = await prisma.user.findUnique({
    where: { email: email2.toLowerCase() },
  });

  if (!user1 || !user2) {
    console.log("❌ One or both users not found");
    await prisma.$disconnect();
    return;
  }

  console.log(`User 1: ${user1.email} (${user1.role}${user1.adminRole ? ` - ${user1.adminRole}` : ''})`);
  console.log(`User 2: ${user2.email} (${user2.role}${user2.adminRole ? ` - ${user2.adminRole}` : ''})`);
  console.log();

  const permissions = Object.keys(PERMISSIONS);

  console.log("Permission".padEnd(30) + "User 1".padEnd(10) + "User 2");
  console.log("-".repeat(60));

  permissions.forEach(perm => {
    const user1Has = hasPermission(user1, perm);
    const user2Has = hasPermission(user2, perm);
    
    console.log(
      perm.padEnd(30) +
      (user1Has ? '✅' : '❌').padEnd(10) +
      (user2Has ? '✅' : '❌')
    );
  });

  console.log();
  await prisma.$disconnect();
}

// ==========================================
// CLI INTERFACE
// ==========================================

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (!command) {
  console.log("\n📚 ROLE SYSTEM DIAGNOSTIC UTILITIES\n");
  console.log("Usage:");
  console.log("  node role-diagnostics.js diagnose <email>");
  console.log("  node role-diagnostics.js test <email>");
  console.log("  node role-diagnostics.js compare <email1> <email2>");
  console.log();
  console.log("Examples:");
  console.log("  node role-diagnostics.js diagnose admin@mybigyard.com");
  console.log("  node role-diagnostics.js test admin@mybigyard.com");
  console.log("  node role-diagnostics.js compare admin@mybigyard.com user@mybigyard.com");
  console.log();
  process.exit(0);
}

switch (command) {
  case 'diagnose':
    if (!arg1) {
      console.log("❌ Please provide an email address");
      process.exit(1);
    }
    diagnoseUserRole(arg1);
    break;

  case 'test':
    if (!arg1) {
      console.log("❌ Please provide an email address");
      process.exit(1);
    }
    runTestSuite(arg1);
    break;

  case 'compare':
    if (!arg1 || !arg2) {
      console.log("❌ Please provide two email addresses");
      process.exit(1);
    }
    compareUsers(arg1, arg2);
    break;

  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log("Valid commands: diagnose, test, compare");
    process.exit(1);
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  diagnoseUserRole,
  testMiddlewareAuthorization,
  runTestSuite,
  compareUsers,
};