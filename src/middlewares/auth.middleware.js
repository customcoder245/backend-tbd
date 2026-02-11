import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Invitation from "../models/invitation.model.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" });
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};

/**
 * Allows both logged-in users and employees with invite tokens
 */
export const flexibleProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const inviteToken = req.headers["x-invite-token"];

  // 1. Try Session Token (Admin/Leader/Manager)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.userId) {
        req.user = decoded;
        return next();
      }
    } catch (err) {
      // If it's a session token but expired, we should probably stop here
      if (err.name === 'TokenExpiredError' && !inviteToken) {
        return res.status(401).json({ message: "Session expired" });
      }
    }
  }

  // 2. Try Invite Token (Employee)
  if (inviteToken) {
    try {
      const decoded = jwt.verify(inviteToken, process.env.JWT_SECRET);

      const invitation = await Invitation.findOne({
        adminId: new mongoose.Types.ObjectId(decoded.invitedId),
        email: decoded.email,
        role: "employee"
      });

      if (invitation) {
        req.employee = {
          email: decoded.email,
          invitedBy: invitation.invitedBy,
          orgName: invitation.orgName,
          invitationId: invitation._id
        };
        return next();
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Invitation expired" });
      }
    }
  }

  return res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
};
