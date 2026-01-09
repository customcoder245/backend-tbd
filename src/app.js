// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// // ROUTES
// import authRoutes from "./routes/auth.routes.js";
// import assessmentRoutes from "./routes/assessment.routes.js";
// import questionRoutes from "./routes/question.routes.js";
// import responseRoutes from "./routes/response.routes.js";

// const app = express();

// // Parse incoming JSON requests
// app.use(express.json());
// app.use(cookieParser());

// // const allowedOrigins = [
// //   'http://localhost:5173',                
// //   'https://tbd-frontend-bice.vercel.app'   
// // ];

// // app.use(
// //   cors({
// //     origin: function (origin, callback) {
// //       // Allow requests with no origin (e.g., mobile apps, curl, Postman)
// //       if (!origin) {
// //         return callback(null, true);
// //       }

// //       // Check if the origin is in the allowedOrigins array
// //       if (allowedOrigins.indexOf(origin) !== -1) {
// //         return callback(null, true);
// //       }

// //       // Reject other origins with a more informative error message
// //       return callback(new Error(`CORS policy: Origin '${origin}' is not allowed`), false);
// //     },
// //   })
// // );



// // Enable CORS
// app.use(
//   cors({
//     origin: 'https://tbd-frontend-bice.vercel.app/api/v1' 
//   })
// );

// // Health check route
// app.get("/api/v1/test", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "API is working 🚀"
//   });
// });

// // ROUTE MOUNTING
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/assessment", assessmentRoutes);
// app.use("/api/v1/questions", questionRoutes);
// app.use("/api/v1/responses", responseRoutes);

// export { app };







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

// Enable CORS
app.use(
  cors({
    // origin: "https://talent-by-design.vercel.app/",
    origin: process.env.FRONTEND_URL ||  "*",
    credentials: true
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