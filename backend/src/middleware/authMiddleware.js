// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { ROLE_HIERARCHY, ADMIN_HIERARCHY } from "../config/roles.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Convert userId string to BigInt for Prisma queries
    const userId = BigInt(decoded.userId);
    
    // Set user object
    req.user = {
      id: userId,           // BigInt for Prisma queries
      userId: userId,       // BigInt for Prisma queries
      email: decoded.email,
      role: decoded.role,
      adminRole: decoded.adminRole || null,
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authorize = ({ minRole = "USER", adminRoles = [] } = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const requiredRoleLevel = ROLE_HIERARCHY[minRole];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ message: "Insufficient role" });
    }

    if (adminRoles.length > 0) {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const adminLevel = ADMIN_HIERARCHY[req.user.adminRole];
      const allowedLevels = adminRoles.map((r) => ADMIN_HIERARCHY[r]);

      if (!allowedLevels.some((level) => adminLevel >= level)) {
        return res.status(403).json({ message: "Admin permission denied" });
      }
    }

    next();
  };
};