// src/models/reportModel.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    domain: { type: String, required: true },
    subdomain: { type: String, required: true },
    overallScore: { type: Number, required: true },
    insights: { type: String },
    keyResults: { type: String },
});

const Report = mongoose.model('Report', reportSchema);

export default Report;