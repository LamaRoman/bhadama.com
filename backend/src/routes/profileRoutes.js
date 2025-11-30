import express from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get profile infor

router.get("/",authMiddleware,async(req,res)=>{
    try{
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: {id:userId},
            select:{id:true,name:true,email:true,role:true}
        })
        if(!user) return res.status(404).json({error:"User not found"});
        res.json({user});
    }catch(err){
        console.error("GET PROFILE ERROR:",err);
        res.status(500).json({error:"Failed to fetch profile"});
    }
})

export default router;