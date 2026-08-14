import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

export const request = action({
  args: { email: v.string() },
  handler: async (ctx, { email: rawEmail }) => {
    const email = rawEmail.toLowerCase().trim();
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    const created = await ctx.runMutation(internal.users.createPasswordReset, { email, code });
    if (!created.ok) return created;
    if (!created.deliver) return { ok: true as const };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PASSWORD_RESET_FROM_EMAIL;
    if (!apiKey || !from) return { ok: false as const, error: 'email-not-configured' as const };
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'رمز استعادة كلمة المرور لتطبيق نفحات',
        html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>استعادة كلمة المرور</h2><p>رمز التحقق الخاص بك:</p><p style="font-size:30px;font-weight:bold;letter-spacing:6px">${code}</p><p>ينتهي الرمز خلال 15 دقيقة. لا تشاركه مع أحد.</p></div>`,
      }),
    });
    if (!response.ok) return { ok: false as const, error: 'email-failed' as const };
    return { ok: true as const };
  },
});
