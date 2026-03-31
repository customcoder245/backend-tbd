import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./db/index.js";
import { speedInsightsMiddleware } from "./utils/speedInsights.js";

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

// Enable Speed Insights middleware (adds headers for frontend integration)
app.use(speedInsightsMiddleware);

// Cors moved here for cleaner flow
const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";

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

// Speed Insights configuration endpoint
app.get("/api/v1/speed-insights/config", (req, res) => {
  res.status(200).json({
    success: true,
    speedInsightsEnabled: process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined,
    message: "Speed Insights is configured. For frontend integration, install @vercel/speed-insights in your frontend application.",
    documentation: "https://vercel.com/docs/speed-insights/quickstart"
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