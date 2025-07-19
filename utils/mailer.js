import nodemailer from "nodemailer";

export const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"DSA-Lingo" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Your DSA-Lingo Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #0891b2;">Welcome to DSA-Lingo!</h2>
          <p>Your One-Time Password (OTP) to verify your email is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333;">${otp}</p>
          <p>This code is valid for 10 minutes.</p>
          <hr>
          <p style="font-size: 0.9em; color: #888;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`SUCCESS: OTP email sent to ${to}`);
  } catch (error) {
    console.error(`ERROR: Could not send OTP email to ${to}.`, error);
  }
};
