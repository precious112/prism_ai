import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;
  const { data, error } = await resend.emails.send({
    from: "precious@trysixth.com",
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  });

  if (error) {
    console.error("Resend Error:", error);
  } else {
    console.log("Resend Success:", data);
  }
};
