import express from "express";
import 'dotenv/config';
import cors from "cors"
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import host from "./routes/host.js";
import admin from "./routes/admin.js";
import listingRoutes from "./routes/listingRoutes.js";

const app = express();
app.use(express.json())
app.use(cors());


// Routes
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/admin",admin);
app.use("/api/listings",listingRoutes);
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
