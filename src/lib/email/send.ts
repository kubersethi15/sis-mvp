// Email utility — Resend provider with graceful degradation
// If RESEND_API_KEY is not set, emails are logged but not sent.
// This allows the system to work without email during development.

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Kaya <noreply@kaya.work>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kaya-mvp-rose.vercel.app';

// ============================================================
// SEND EMAIL — returns { sent, error? }
// ============================================================

interface SendResult {
  sent: boolean;
  id?: string;
  error?: string;
  degraded?: boolean; // true if email was skipped due to missing API key
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn(`[Email] RESEND_API_KEY not set — email to ${to} skipped (subject: "${subject}")`);
    return { sent: false, degraded: true, error: 'Email provider not configured' };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Send failed to ${to}:`, error);
      return { sent: false, error: error.message };
    }

    console.log(`[Email] Sent to ${to} — id: ${data?.id}`);
    return { sent: true, id: data?.id };
  } catch (e: any) {
    console.error(`[Email] Error sending to ${to}:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ============================================================
// REFERENCE INVITATION EMAIL
// ============================================================

export async function sendReferenceInvitation({
  referenceName,
  referenceEmail,
  candidateName,
  token,
  relationship,
}: {
  referenceName: string;
  referenceEmail: string;
  candidateName: string;
  token: string;
  relationship?: string;
}): Promise<SendResult> {
  const referenceUrl = `${BASE_URL}/reference?token=${token}`;
  const subject = `${candidateName} has asked for your assessment — Kaya Skills Verification`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:'DM Sans',Arial,sans-serif;color:#042C53;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    
    <!-- Header -->
    <div style="background:#042C53;border-radius:12px 12px 0 0;padding:28px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#E6F1FB;font-family:Georgia,serif;letter-spacing:-0.5px;">kaya</p>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(230,241,251,0.5);text-transform:uppercase;letter-spacing:2px;">Skills Verification Request</p>
    </div>
    
    <!-- Body -->
    <div style="background:#FFFFFF;padding:32px;border:1px solid #E3E1D8;border-top:none;">
      <p style="font-size:15px;line-height:1.65;color:#5F5E5A;margin:0 0 16px;">
        Hi${referenceName ? ` ${referenceName}` : ''},
      </p>
      <p style="font-size:15px;line-height:1.65;color:#5F5E5A;margin:0 0 16px;">
        <strong style="color:#042C53;">${candidateName}</strong> has completed a skills assessment through Kaya and has listed you as a reference${relationship ? ` (${relationship})` : ''}. Your independent assessment helps verify their skills and makes their profile more trustworthy for employers.
      </p>
      <p style="font-size:15px;line-height:1.65;color:#5F5E5A;margin:0 0 24px;">
        It takes about <strong style="color:#042C53;">5 minutes</strong>. You'll rate specific skills based on what you've observed, with optional examples.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${referenceUrl}" style="display:inline-block;background:#042C53;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:8px;">
          Complete assessment
        </a>
      </div>
      
      <p style="font-size:13px;line-height:1.5;color:#8A887F;margin:0 0 8px;">
        Your responses are confidential and used only for skills assessment purposes. They are not shared with ${candidateName}.
      </p>
      <p style="font-size:13px;line-height:1.5;color:#B4B2A9;margin:0;">
        If the button doesn't work, copy this link:<br>
        <a href="${referenceUrl}" style="color:#185FA5;word-break:break-all;">${referenceUrl}</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#F1EFE8;padding:20px 32px;border:1px solid #E3E1D8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0;font-size:11px;color:#B4B2A9;text-align:center;">
        kaya.work · Virtualahan Inc. · Hire who can.
      </p>
    </div>
    
  </div>
</body>
</html>`;

  return sendEmail(referenceEmail, subject, html);
}

// ============================================================
// APPLICATION STATUS EMAIL (future use)
// ============================================================

export async function sendApplicationUpdate({
  candidateEmail,
  candidateName,
  status,
  message,
}: {
  candidateEmail: string;
  candidateName: string;
  status: string;
  message: string;
}): Promise<SendResult> {
  const subject = `Your Kaya application — ${status}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:'DM Sans',Arial,sans-serif;color:#042C53;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="background:#042C53;border-radius:12px 12px 0 0;padding:28px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#E6F1FB;font-family:Georgia,serif;">kaya</p>
    </div>
    <div style="background:#FFFFFF;padding:32px;border:1px solid #E3E1D8;border-top:none;">
      <p style="font-size:15px;line-height:1.65;color:#5F5E5A;">Hi ${candidateName},</p>
      <p style="font-size:15px;line-height:1.65;color:#5F5E5A;">${message}</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/my-dashboard" style="display:inline-block;background:#042C53;color:#FFFFFF;text-decoration:none;font-weight:600;padding:14px 36px;border-radius:8px;">
          View your dashboard
        </a>
      </div>
    </div>
    <div style="background:#F1EFE8;padding:20px 32px;border:1px solid #E3E1D8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0;font-size:11px;color:#B4B2A9;text-align:center;">kaya.work · Virtualahan Inc.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail(candidateEmail, subject, html);
}
