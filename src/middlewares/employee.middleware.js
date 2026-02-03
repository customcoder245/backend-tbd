// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import Invitation from "../models/invitation.model.js";

// export const employeeAccess = async (req, res, next) => {
//   const token =
//     req.headers["x-invite-token"] ||
//     req.params.token ||
//     req.query.token;

//   if (!token) {
//     return res.status(401).json({ message: "Invitation token required" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded token:", decoded);

//     const invitation = await Invitation.findById(
//       new mongoose.Types.ObjectId(decoded.invitedId)
//     );

//     if (!invitation) {
//       return res.status(401).json({ message: "Invalid invitation" });
//     }

//     if (invitation.email !== decoded.email) {
//       return res.status(401).json({ message: "Invitation email mismatch" });
//     }

//     if (invitation.used === true) {
//       return res.status(400).json({ message: "Invitation already used" });
//     }

//     if (
//       !invitation.expiredAt ||
//       new Date(invitation.expiredAt).getTime() < Date.now()
//     ) {
//       return res.status(400).json({ message: "Invitation expired" });
//     }

//     req.employee = {
//       email: decoded.email,
//       invitedBy: invitation.invitedBy,
//       orgName: invitation.orgName,
//       invitationId: invitation._id
//     };

//     next();
//   } catch (err) {
//     console.error("employeeAccess middleware error:", err);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };



import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // 🔥 FIX: invitedId === adminId (NOT invitation _id)
    const invitation = await Invitation.findOne({
      adminId: new mongoose.Types.ObjectId(decoded.invitedId),
      email: decoded.email,
      role: "employee"
    });

    if (!invitation) {
      return res.status(401).json({ message: "Invalid invitation" });
    }

    if (invitation.used === true) {
      return res.status(400).json({ message: "Invitation already used" });
    }

    if (
      !invitation.expiredAt ||
      new Date(invitation.expiredAt).getTime() < Date.now()
    ) {
      return res.status(400).json({ message: "Invitation expired" });
    }

    req.employee = {
      email: decoded.email,
      invitedBy: invitation.invitedBy,
      orgName: invitation.orgName,
      invitationId: invitation._id
    };

    next();
  } catch (err) {
    console.error("employeeAccess middleware error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
