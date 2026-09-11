import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express"
import swaggerSpec from "../swagger.js"

import connectDB from "./db/index.js";

// ROUTES
import authRoutes from "./routes/auth.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import employeeAssessmentRoutes from "./routes/employeeAssessment.routes.js";
import questionRoutes from "./routes/question.routes.js";
import responseRoutes from "./routes/response.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import contactRoutes from "./routes/contact.routes.js";

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

// Support multiple allowed origins via comma-separated CORS_ORIGIN (e.g. "http://localhost:5173,https://talent-by-design.vercel.app")
const rawOrigins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";
const allowedOrigins = rawOrigins === "*" ? "*" : rawOrigins.split(",").map(o => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins === "*") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
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
app.use("/api/v1/organization", organizationRoutes);
app.use("/api/v1/contact", contactRoutes);

// SWAGGER API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { app };