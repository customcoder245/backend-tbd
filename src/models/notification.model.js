import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String, // info, success, warning, error
        default: "info"
    },
    link: {
        type: String,
        
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
