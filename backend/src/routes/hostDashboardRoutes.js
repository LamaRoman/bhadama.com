import express from "express";
import {authMiddleware} from "../middleware/authMiddleware.js";
import {roleMiddleware}  from "../middleware/roleMiddleware.js";

const router = express();

router.get("/bookings",authMiddleware,roleMiddleware(["HOST"]),(req,res)=>{
    res.json({
        message:"Bookings comming soon ...",
        bookings:[],
    });
});

router.get("/earnings",authMiddleware,roleMiddleware(["HOST"]),(req,res)=>{
    res.json({
        totalEarnings: 0,
        monthlyEarnings: [],
    })
})

router.get("/analytics",authMiddleware,roleMiddleware(["HOST"]),(req,res)=>{
    res.json({
        views: 0,
        inquiries:0,
        conversions:0,
    })
})

export default router;