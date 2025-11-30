import express from "express";
import 'dotenv/config';
import cors from "cors"
import authRoutes from "./routes/auth.js";
import userBookingRoutes from "./routes/usersBookingRoutes.js";
import admin from "./routes/admin.js";
import publicListingRoutes from "./routes/publicListingRoutes.js";
import hostListingsRoutes from "./routes/hostListingRoutes.js"
import availabilityRoutes from "./routes/availabilityRoutes.js"
import userProfileRoutes from "./routes/profileRoutes.js"
import bookingRoutes from "./routes/bookingRoutes.js"

const app = express();
app.use(express.json())
app.use(cors());


// Routes
app.use("/api/auth",authRoutes);
app.use("/api/usersBooking",userBookingRoutes);
app.use("/api/hostListings",hostListingsRoutes);
app.use("/api/admin",admin);
app.use("/api/publicListings",publicListingRoutes);
app.use("/api/availability",availabilityRoutes);
app.use("/api/userBookings",userBookingRoutes);
app.use("/api/users",userProfileRoutes);
app.use("/api/bookings",bookingRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hello! Server is working.");
});

//Testing
/*
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  res.json({ success: true, received: { name, email, password, role } });
});
*/


const PORT = process.env.PORT; 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
