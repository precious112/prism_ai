import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${token}`;
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

export const sendInvitationEmail = async (email: string, token: string, organizationName: string) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const invitationLink = `${clientUrl}/invitations/accept?token=${token}`;
  const { data, error } = await resend.emails.send({
    from: "precious@trysixth.com",
    to: email,
    subject: `You've been invited to join ${organizationName} on Prism AI`,
    html: `<p>You have been invited to join <strong>${organizationName}</strong> on Prism AI.</p><p>Click the link below to accept the invitation:</p><a href="${invitationLink}">${invitationLink}</a>`,
  });

  if (error) {
    console.error("Resend Invitation Error:", error);
  } else {
    console.log("Resend Invitation Success:", data);
  }
};
