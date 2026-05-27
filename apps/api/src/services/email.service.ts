import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "oruClassrooms <no-reply@oruclassrooms.com>";

export async function sendInvitationEmail(opts: {
  to: string;
  inviterName: string;
  workspaceName: string;
  joinUrl: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `${opts.inviterName} invited you to ${opts.workspaceName}`,
    html: `
      <p>Hi,</p>
      <p><strong>${opts.inviterName}</strong> has invited you to join the workspace <strong>${opts.workspaceName}</strong> on oruClassrooms.</p>
      <p><a href="${opts.joinUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Accept Invitation</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });
}

export async function sendSessionDigestEmail(opts: {
  to: string;
  trainingTitle: string;
  participantCount: number;
  moduleCount: number;
  completedAt: string;
  analyticsUrl: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Session complete: ${opts.trainingTitle}`,
    html: `
      <p>Your training session <strong>${opts.trainingTitle}</strong> has ended.</p>
      <ul>
        <li>Participants: ${opts.participantCount}</li>
        <li>Modules completed: ${opts.moduleCount}</li>
        <li>Ended: ${opts.completedAt}</li>
      </ul>
      <p><a href="${opts.analyticsUrl}">View full analytics →</a></p>
    `,
  });
}

export async function sendJoinReminderEmail(opts: {
  to: string;
  trainingTitle: string;
  scheduledAt: string;
  joinUrl: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Reminder: ${opts.trainingTitle} starts soon`,
    html: `
      <p>This is a reminder that <strong>${opts.trainingTitle}</strong> starts at <strong>${opts.scheduledAt}</strong>.</p>
      <p><a href="${opts.joinUrl}">Join session →</a></p>
    `,
  });
}
