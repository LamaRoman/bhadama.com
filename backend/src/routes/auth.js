import express from "express";
import {prisma} from "../config/prisma.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// Test Route
router.get("/", (req, res) => {
    res.json({message: "test works"})
})

// Register
router.post("/register", async (req, res) => {
    const {name, email, password, role} = req.body;
    
    try {
        console.log("📥 Registration request received:", { email, role });
        
        const existingUser = await prisma.user.findUnique({where: {email}});
        if (existingUser) {
            return res.status(400).json({error: "Email already exists"});
        }
        
        console.log("🔐 Password hashed successfully");
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: {name, email, password: hashedPassword, role}
        });
        
        console.log("✅ User created in database:", { id: user.id, email: user.email, role: user.role });
        
        // ✅ Convert user.id to Number before signing JWT
        const token = jwt.sign(
            {
                userId: Number(user.id),  // ✅ CONVERT TO NUMBER HERE
                email: user.email,
                role: user.role,
                adminRole: user.adminRole
            },
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );
        
        console.log("🎫 JWT token generated");
        console.log("📤 Sending response:", { 
            status: 201, 
            hasToken: true, 
            userId: Number(user.id)  // ✅ Convert in response too
        });
        
        res.status(201).json({
            token,
            user: {
                id: Number(user.id),  // ✅ CONVERT TO NUMBER HERE
                name: user.name,
                email: user.email,
                role: user.role,
                adminRole: user.adminRole
            }
        });
    } catch(err) {
        console.error("❌ Registration error:", err);
        res.status(500).json({error: "Server error"});
    }
});

// Login
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    
    try {
        const user = await prisma.user.findUnique({where: {email}});
        console.log("User from database:", user); 
        
        if (!user) {
            return res.status(400).json({error: "Invalid credentials"});
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({error: "Invalid credentials"});
        }
        
        // ✅ Convert user.id to Number before signing JWT
        const token = jwt.sign(
            {
                userId: Number(user.id),  // ✅ CONVERT TO NUMBER HERE
                email: user.email,
                role: user.role,
                adminRole: user.adminRole
            },
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );
        
        res.json({
            token,
            user: {
                id: Number(user.id),  // ✅ CONVERT TO NUMBER HERE
                name: user.name,
                email: user.email,
                role: user.role,
                adminRole: user.adminRole,
                profilePhoto: user.profilePhoto
            }
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: "Server error"})
    }
})

export default router;