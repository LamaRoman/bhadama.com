import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { roleMiddleware } from "../middleware/roleMiddleware.js"
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


const router =  express.Router()


router.get("/",(req,res)=>{
    res.send("User route working")
})

//Get logged-in user's profile
router.get("/profile",authMiddleware,async(req,res)=>{
    try{
        const user = await prisma.user.findUnique({
            where:{id:req.user.userId},
            select:{id:true,name:true,email:true,role:true},
        })
        if(!user) return res.status(404).json({message:"User not found"})
            res.json({user})
        }catch(err){
            console.error(err);
            res.status(500).json({message:"Server error"})
        }
})

// Accessible to any logged-in user
router.get("/me",authMiddleware,(req,res)=>{
    res.json({message:`Welcome ${req.user.email}`,role:req.user.role})
})

// Only admin can access
router.get("/admin/dashboard",authMiddleware,roleMiddleware(["ADMIN"]),(req,res)=>{
    res.json({message:`Welcome Host ${req.user.email}`})
});

// Only host can access
router.get("/host/dashboard",authMiddleware,roleMiddleware(["HOST"]),(req,res)=>{
    res.json({message:`Welcome Host ${req.user.email}`})
})

export default router;