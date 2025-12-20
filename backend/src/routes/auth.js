import express from "express";
import {prisma} from "../config/prisma.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// Test Route

router.get("/",(req,res)=>{
    res.json({message:"test works"})
})

// Register
router.post("/register",async(req,res)=>{
    const {name,email,password,role} = req.body;
    try{
        const existingUser = await prisma.user.findUnique({where:{email}});
        if (existingUser) return res.status(400).json({error:"Email already exists"});
    
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await prisma.user.create({
            data:{name,email,password:hashedPassword,role}
        });
        const token = jwt.sign({userId:user.id,email:user.email,role:user.role,adminRole:user.adminRole},process.env.JWT_SECRET,{expiresIn:"7d"});
        res.json({token,user});
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Server error"});
    }
});

// Login
router.post("/login",async(req,res)=>{
    const {email,password} = req.body;
    try{
            const user = await prisma.user.findUnique({where:{email}});
            console.log("User from database:", user); 
            if(!user) return res.status(400).json({error:"Invalid credentials"})
    
            const isMatch = await bcrypt.compare(password,user.password);
            if(!isMatch) return res.status(400).json({error:"Invalid credentials"})

            const token = jwt.sign({userId:user.id,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});
            res.json({token,user});

        }catch(err){
            console.error(err.message);
            res.status(500).json({error:"Sercer error"})
        }
})

export default router;
