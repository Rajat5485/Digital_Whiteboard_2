import express from "express";
import { sendNotesEmail } from "../utils/mailer.js";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-notes", protect, async (req, res) => {
  const { toEmail, toEmails, recipientUserIds, subject, text, attachment, filename } = req.body;
  console.log("📩 Incoming mail request");

  const replyTo = req.user.email;
  const fromName = req.user.name;

  try {
    let emails = [];
    if (toEmail) {
      emails.push(toEmail);
    }
    if (toEmails && Array.isArray(toEmails)) {
      emails = [...emails, ...toEmails];
    }
    if (recipientUserIds && Array.isArray(recipientUserIds)) {
      const users = await User.find({ userId: { $in: recipientUserIds } });
      const userEmails = users.map(u => u.email).filter(Boolean);
      emails = [...emails, ...userEmails];
    }

    // Remove duplicates and filter empty/invalid strings
    emails = [...new Set(emails)].filter(Boolean);

    if (emails.length === 0) {
      console.error("❌ No recipients specified");
      return res.status(400).json({ message: "No recipients specified" });
    }

    let successCount = 0;
    for (const email of emails) {
      const success = await sendNotesEmail(email, subject, text, attachment, filename, replyTo, fromName);
      if (success) successCount++;
    }

    if (successCount > 0) {
      res.status(200).json({ message: `Successfully sent email to ${successCount} recipients.` });
    } else {
      res.status(500).json({ message: "Failed to send email to any recipients. Check backend logs." });
    }
  } catch (err) {
    console.error("❌ Mail route error:", err);
    res.status(500).json({ message: "Server error sending email" });
  }
});

export default router;
