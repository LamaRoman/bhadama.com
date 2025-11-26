import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { roleMiddleware } from "../middleware/roleMiddleware.js"
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
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

router.post("/create-admin", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN", // Must match enum exactly
      },
    });

    res.json({ message: "Admin created successfully", admin });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Error creating admin" });
  }
});



export default router;