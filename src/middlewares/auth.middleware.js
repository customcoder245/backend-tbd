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
  const inviteTokenFromHeader = req.headers["x-invite-token"];
  const inviteTokenFromCookie = req.cookies?.invitationToken;
  const inviteToken = inviteTokenFromHeader || inviteTokenFromCookie;

  const accessTokenFromCookie = req.cookies?.accessToken;

  // 1. Try Session Token (Admin/Leader/Manager - LOGGED IN)
  if ((authHeader && authHeader.startsWith("Bearer ")) || accessTokenFromCookie) {
    try {
      const token = authHeader ? authHeader.split(" ")[1] : accessTokenFromCookie;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.userId) {
        req.user = decoded;
        return next();
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError' && !inviteToken) {
        return res.status(401).json({ message: "Session expired" });
      }
      // If it's a session token but invalid, we continue to check inviteToken
    }
  }

  // 2. Try Invite Token (ALL STAKEHOLDERS - via URL/Header)
  if (inviteToken) {
    try {
      const decoded = jwt.verify(inviteToken, process.env.JWT_SECRET);

      // Find the invitation by token directly for maximum reliability
      // We don't check 'used: false' here because we just need to identify the guest
      const invitation = await Invitation.findOne({
        $or: [{ token: inviteToken }, { token1: inviteToken }],
        email: decoded.email
      });

      if (invitation) {
        // We set req.employee/req.guest to distinguish from logged-in users
        req.guest = {
          email: decoded.email,
          role: decoded.role || invitation.role,
          invitedBy: invitation.invitedBy,
          orgName: invitation.orgName,
          invitationId: invitation._id
        };
        // For backwards compatibility with controllers expecting req.employee
        req.employee = req.guest;

        return next();
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Invitation link has expired" });
      }
    }
  }

  return res.status(401).json({ message: "Unauthorized. Please login or use a valid invitation link." });
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user is logged in
    if (!req.user) {
      return res.status(401).json({ message: "You are not logged in" });
    }

    // roles: ['admin', 'superadmin']
    if (!roles.includes(req.user.role?.toLowerCase())) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
