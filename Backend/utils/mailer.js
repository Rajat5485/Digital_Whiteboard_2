import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const emailUser = process.env.EMAIL_USER || "";
const isGmail = emailUser.endsWith("@gmail.com");

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});




export const sendAttendanceEmail = async (teacherEmail, teacherName, presentStudents) => {
  try {
    const studentList = presentStudents.map(s => `- ${s}`).join("\n");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: teacherEmail,
      subject: `Attendance Report - ${new Date().toLocaleDateString()}`,
      text: `Hello ${teacherName},\n\nAttendance has been processed for your class.\n\nPresent Students:\n${studentList}\n\nBest regards,\nDigital Whiteboard System`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Attendance email sent to ${teacherEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending attendance email:", error);
    return false;
  }
};

export const sendNotesEmail = async (toEmail, subject, text, attachmentBase64 = null, filename = "whiteboard-notes.pdf", replyTo = null, fromName = null) => {
  try {
    const fromHeader = fromName ? `"${fromName}" <${process.env.EMAIL_USER}>` : process.env.EMAIL_USER;
    const mailOptions = {
      from: fromHeader,
      to: toEmail,
      subject: subject,
      text: text,
      ...(replyTo && { replyTo }),
    };

    if (attachmentBase64) {
      mailOptions.attachments = [
        {
          filename: filename || "whiteboard-notes.pdf",
          content: attachmentBase64.split("base64,")[1],
          encoding: "base64",
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Nodemailer Error:", error.message);
    if (error.response) console.error("❌ SMTP Response:", error.response);
    return false;
  }
};



