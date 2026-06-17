import { sendContactUsEmail } from "../utils/sendEmail.js";

/**
 * Handle Contact Us form submission
 */
export const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and message are required fields.",
      });
    }

    // Call the email utility to send the email
    await sendContactUsEmail({ firstName, lastName, email, phone, message });

    return res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    console.error("Error in submitContactForm:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing the contact form",
    });
  }
};
