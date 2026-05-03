import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
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
