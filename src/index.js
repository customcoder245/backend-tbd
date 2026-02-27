import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './.env',
    quiet: true
});

// Connect to DB on module load (not inside app.listen)
connectDB();

export default app;
