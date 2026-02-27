import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './.env',
    quiet: true
});

// Cache the DB connection across warm serverless invocations
let dbConnected = false;

export default async function handler(req, res) {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (err) {
            console.error('DB connection failed:', err.message);
            return res.status(500).json({ success: false, message: 'Database connection failed' });
        }
    }
    return app(req, res);
}
