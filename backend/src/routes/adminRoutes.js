import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Temporary placeholder data
const users = [
  { id: 1, name: "User One", email: "user1@test.com" },
  { id: 2, name: "User Two", email: "user2@test.com" },
];

const hosts = [
  { id: 1, name: "Host One", email: "host1@test.com" },
  { id: 2, name: "Host Two", email: "host2@test.com" },
];

const listings = [
  { id: 1, title: "Listing One", host: "Host One" },
  { id: 2, title: "Listing Two", host: "Host Two" },
];

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req,res)=>{
    res.json(users)
  }
);
// Routes
router.get("/users", authMiddleware, roleMiddleware(["ADMIN"]), (req, res) => {
  res.json(users);
});

router.get("/hosts", authMiddleware, roleMiddleware(["ADMIN"]), (req, res) => {
  res.json(hosts);
});

router.get("/listings", authMiddleware, roleMiddleware(["ADMIN"]), (req, res) => {
  res.json(listings);
});

export default router;
