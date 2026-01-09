export const requireAdmin = (req, res, next) => {
    if(req.user.role !== "admin") {
        res.status(403).json({ message: "Only admin can login "})
    }

    next();
}