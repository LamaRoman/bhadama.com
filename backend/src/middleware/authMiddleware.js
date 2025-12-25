// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { ROLE_HIERARCHY, ADMIN_HIERARCHY } from "../config/roles.js";

export const authenticate = (req, res, next) => {
  console.log('🔍 [authenticate] START - URL:', req.url, 'Method:', req.method);
  console.log('🔍 [authenticate] Full headers:', req.headers);
  
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('❌ [authenticate] No Bearer token found');
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  console.log('🔍 [authenticate] Token extracted:', token.substring(0, 20) + '...');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [authenticate] Token decoded successfully:', decoded);
    
    // Set user object
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      adminRole: decoded.adminRole || null,
    };
    
    console.log('✅ [authenticate] req.user SET to:', req.user);
    console.log('✅ [authenticate] req.user.id:', req.user.id);
    console.log('✅ [authenticate] req.user.userId:', req.user.userId);
    
    // Call next middleware
    next();
  } catch (error) {
    console.error('❌ [authenticate] Token verification failed:', error.message);
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
