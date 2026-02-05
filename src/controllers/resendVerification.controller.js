import User from "../models/user.model.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

// Controller to handle resending the verification email
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;  // Get the email from the request body

  try {
    // Step 1: Check if the user exists by the provided email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "No user found with this email" });
    }

    // Step 2: If the email is already verified, return a message
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Step 3: Check if the verification token has expired
    const isTokenExpired = user.emailVerificationExpires < Date.now();

    if (isTokenExpired) {
      // Step 4: If the token is expired, generate a new token and set a new expiration time
      const newToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      user.emailVerificationToken = newToken;
      user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;  // 1 hour expiration

      await user.save();  // Save the updated user object

      // Step 5: Send the new verification email with the new token
      const verifyLink = `${process.env.BACKEND_URL}auth/verify-email/${newToken}`;
      await sendVerificationEmail(user, verifyLink);

      return res.status(200).json({
        message: "Your verification token expired. A new verification email has been sent."
      });
    }

    // If the token is not expired, inform the user
    return res.status(400).json({ message: "Verification token is still valid. Please check your inbox." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while resending the verification email." });
  }
};
