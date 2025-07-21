import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String, // e.g., "Accepted", "Failed", "Compilation Error", "Runtime Error"
      required: true,
    },
    results: [
      {
        testCase: { type: Number, required: true },
        status: { type: String, required: true }, // e.g., "Accepted", "Wrong Answer", "Time Limit Exceeded"
        isCorrect: { type: Boolean, required: true },
        userOutput: { type: String },
        expectedOutput: { type: String },
        time: { type: String }, // Stored as string for flexibility (e.g., "0.01s")
        memory: { type: String }, // Stored as string (e.g., "1024KB")
        error: { type: String },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

const Submission = mongoose.model("Submission", SubmissionSchema);

export default Submission;
