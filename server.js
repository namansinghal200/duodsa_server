import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import problemRoutes from "./routes/problemRouter.js";
import submissionRoutes from "./routes/submissionRoutes.js"; // NEW: Import submission routes

// --- Initial Setup ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("SUCCESS: MongoDB connected successfully."))
  .catch((err) => console.error("ERROR: MongoDB connection error:", err));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes); // NEW: Use submission routes

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.send("DuoDSA API is running...");
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
