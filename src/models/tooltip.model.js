import mongoose from 'mongoose';

const tooltipSchema = new mongoose.Schema({
    tooltipId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Tooltip = mongoose.model('Tooltip', tooltipSchema);

export default Tooltip;

