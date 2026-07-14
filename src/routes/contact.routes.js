import express from "express";
import { submitContactForm } from "../controllers/contact.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit a contact form
 *     description: Submit contact form details to send an email to the support/admin team.
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the sender
 *                 example: John
 *               lastName:
 *                 type: string
 *                 description: Last name of the sender
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the sender
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: Optional phone number of the sender
 *                 example: "+1234567890"
 *               message:
 *                 type: string
 *                 description: Message text
 *                 example: Hello, I would like to query about your services.
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact form submitted successfully
 *       400:
 *         description: Required fields are missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: First name, last name, email, and message are required fields.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error while processing the contact form
 */
router.post("/", submitContactForm);

export default router;
