// middlewares/employee.middleware.js
import jwt from "jsonwebtoken";
import Invitation from "../models/invitation.model.js";

export const employeeAccess = async (req, res, next) => {
  const token =
    req.params.token ||
    req.query.token ||
    req.headers["x-invite-token"];

  if (!token) {
    return res.status(401).json({ message: "Invitation token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure invitation exists & valid
    const invitation = await Invitation.findOne({
      token,
      email: decoded.email,
      role: "employee"
    });

    if (!invitation) {
      return res.status(401).json({ message: "Invalid invitation" });
    }

    if (invitation.used) {
      return res.status(400).json({ message: "Invitation already used" });
    }

    if (invitation.expiredAt < Date.now()) {
      return res.status(400).json({ message: "Invitation expired" });
    }

    // Attach employee context
    req.employee = {
      email: decoded.email,
      invitedBy: decoded.invitedId,
      orgName: decoded.orgName,
      invitationId: invitation._id
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
