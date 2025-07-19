import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";

// --- Initial Setup ---
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the express app to parse JSON formatted request bodies
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("SUCCESS: MongoDB connected successfully."))
  .catch((err) => console.error("ERROR: MongoDB connection error:", err));

// --- API Routes ---
// All routes starting with /api/auth will be handled by authRoutes
app.use("/api/auth", authRoutes);

// --- Root Endpoint for Testing ---
app.get("/", (req, res) => {
  res.send("DSA-Lingo API is running...");
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
