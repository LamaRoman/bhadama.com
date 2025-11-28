import express from "express";
import {prisma} from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create booking
router.post("/",authMiddleware,async(req,res)=>{
    const {listingId,startDate,endDate}= req.body;
    const userId = req.user.id;

    try{
        // convert to date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Get all availability within that range

        const days = await prisma.availability.findMany({
            where:{
                listingId,
                date:{gte:start,lte:end}
            }
        });

        // 2. Check if all days are available
        const unavailable = days.find(d=>isAvailable === false);
        if(unavailable){
            return res.status(400).json({error:"Some dates are already booked."});
        }

        // 3. Create booking
        const booking = await prisma.booking.create({
            data:{
                listingId,
                userId,
                startDate:start,
                endDate:end
            }
        });

        //4. Update availability to false
        await prisma.availability.updateMany({
            where:{
                listingId,
                date:{gte:start, lte:end}
            },
            data:{isAvailable:false}
        })

        res.json({message:"Booking successful!",booking});
    }catch (err){
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
})

export default router;