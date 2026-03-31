import Tooltip from "../models/tooltip.model.js";

// Replicating common pattern in project:
export const getTooltips = async (req, res) => {
    try {
        const tooltips = await Tooltip.find({});
        res.status(200).json({
            status: "success",
            data: tooltips
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch tooltips",
            error: error.message
        });
    }
};

export const updateTooltip = async (req, res) => {
    try {
        const { tooltipId, content, title } = req.body;

        let tooltip = await Tooltip.findOneAndUpdate(
            { tooltipId },
            { content, title, lastUpdatedBy: req.user.userId },
            { new: true, upsert: true }
        );

        res.status(200).json({
            status: "success",
            data: tooltip
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to update tooltip",
            error: error.message
        });
    }
};
