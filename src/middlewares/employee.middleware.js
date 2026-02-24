import jwt from "jsonwebtoken";
import Invitation from "../models/invitation.model.js";

export const employeeAccess = async (req, res, next) => {
  const token =
    req.headers["x-invite-token"] ||
    req.params.token ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Invitation token required" });
  }

  try {
    // 1️⃣ Verify the JWT is valid (checks signature + expiry)
    jwt.verify(token, process.env.JWT_SECRET);

    // 2️⃣ Look up invitation directly by the stored token in DB
    //    This is the source of truth — more reliable than decoded fields
    const invitation = await Invitation.findOne({
      $or: [{ token: token }, { token1: token }]
    });

    if (!invitation) {
      return res.status(401).json({ message: "Invitation not found. It may have been deleted or is invalid." });
    }

    if (invitation.used === true) {
      return res.status(400).json({ message: "This invitation has already been used." });
    }

    if (!invitation.expiredAt || new Date(invitation.expiredAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Invitation link has expired. Please ask your admin to resend." });
    }

    // 3️⃣ Attach employee info to the request
    req.employee = {
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      orgName: invitation.orgName,
      invitationId: invitation._id
    };

    next();
  } catch (err) {
    console.error("employeeAccess middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invitation token expired. Please ask your admin to resend the invite." });
    }
    return res.status(401).json({ message: "Invalid invitation token." });
  }
};
