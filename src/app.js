import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./db/index.js";

// ROUTES
import authRoutes from "./routes/auth.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import employeeAssessmentRoutes from "./routes/employeeAssessment.routes.js";
import questionRoutes from "./routes/question.routes.js";
import responseRoutes from "./routes/response.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

// Ensures database is connected before handling any request (Crucial for Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// Parse incoming JSON requests
app.use(express.json());
app.use(cookieParser());

// Cors moved here for cleaner flow
const allowedOrigin = process.env.FRONTEND_URL || "*";

// Enable CORS
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);


app.set("trust proxy", 1);


// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working 🚀"
  });
});

// ROUTE MOUNTING
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/assessment", assessmentRoutes);
app.use("/api/v1/employee-assessment", employeeAssessmentRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/responses", responseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

export { app };