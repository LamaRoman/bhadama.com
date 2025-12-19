// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Export as "authenticate" to match your import
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 🔥 THIS LINE IS REQUIRED
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Also add the authorize function if needed
export const authorize = (allowedRoles) =>{
    return(req,res,next)=>{
        if(!req.user) 
            return res.status(401).json({message:"Not authenticated"});
        
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message:"Forbidden:insufficient permissions"})
        }

        next();
    }
}