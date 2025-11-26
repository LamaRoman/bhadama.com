import express from "express";
import {prisma} from "../config/prisma.js"

const router = express.Router();

//Get all listings (public)
router.get("/",async(req,res)=>{
    try{
        const listings = await prisma.listing.findMany({
        include:{
            host:{
                select:{
                    id:true,
                    name:true,
                }
            },
            availability :true,
        }
    })
    res.json(listings)
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Server error"})
    }
    
});

// GET single listing by id (public)
router.get("/:id", async(req,res)=>{
    const id = Number(req.params.id);
    try{
        const listing = await prisma.listing.findUnique({
            where:{id},
            include:{
                host:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
                availability: true,
            }
        });
        if(!listing){
            return res.status(404).json({error:"Listing not found"});
        }
        res.json(listing);
    }catch(err){
        console.error(err);
        res.status(500).json({error:"Server error"});
    }
})

export default router;
