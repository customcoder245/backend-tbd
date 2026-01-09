// import dotenv from 'dotenv';
// import connectDB from './db/index.js';
// import { app } from './app.js';  // Import your Express app

// dotenv.config({
//   path: './env',  // Path to the .env file
//   quiet: true      // Suppresses warning messages
// });

// // Connect to MongoDB
// connectDB()
//   .then(() => {
//     console.log("MongoDB connected successfully.");
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err);
//   });

// // Export the serverless function for Vercel
// export default (req, res) => {
//   app(req, res);  // Pass the request and response to the Express app
// };





import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';  // Import your Express app
 
dotenv.config({
    path: './env',  
    quiet: true      
});
 
 
connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})
 