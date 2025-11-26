import express from 'express'
import { roleMiddleware } from '../middleware/roleMiddleware.js'

const router = express.Router();

router.get("/host",roleMiddleware(["host"],(req,res)=>{
    res.json({message:"Welcome to Host Host",user:req.user})
}));

export default router;