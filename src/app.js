import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ROUTES
import authRoutes from "./routes/auth.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import questionRoutes from "./routes/question.routes.js";

const app = express();

// Parse incoming JSON requests
app.use(express.json());
app.use(cookieParser());

// Enable CORS only for allowed origins in production
const allowedOrigins = process.env.NODE_ENV === "production" 
  ? [process.env.FRONTEND_URL] // production frontend URL (from env)
  : ["http://localhost:3000"];  // Allow localhost in development

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Reject if the origin is not allowed
      return callback(new Error(`CORS policy: Origin '${origin}' is not allowed`), false);
    },
    credentials: true, // Allow cookies to be sent
  })
);

// Health check route
app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working 🚀"
  });
});

// ROUTE MOUNTING
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/assessment", assessmentRoutes);
app.use("/api/v1/questions", questionRoutes);

export { app };
