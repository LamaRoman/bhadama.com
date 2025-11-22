import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {uploadToS3} from "../utils/s3.js";
import prisma from "../prisma/client.js"
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create a new listing
router.post("/",authMiddleware,roleMiddleware(["HOST"]),async(req,res)=>{
    try{
        const {title,description,price,location} = req.body;
        const images = [];

        // If frontend sends base64 images
        if(req.body.images && req.body.images.length >0){
            for(const base64 of req.body.images){
                const url = await uploadToS3(base64);
                images.push(url);
            }
        }
        const listing = await prisma.listing.create({
            data:{
                title,
                description,
                price: parseFloat(price),
                location,
                images,
                hostId: req.user.id,
            }
        });

        res.status(201).json(listing);
    }catch(err){
        res.status(500).json({message:"Server error creating listing"})
    }
});

export default router;