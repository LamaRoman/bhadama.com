import express from 'express'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = express.Router();

router.get("/dashboard",roleMiddleware(["admin"],(req,res)=>{
    res.json({message:"Welcome to Admin Dashboard",user:req.user})
}));

export default router;