import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export function isMailerConfigured(): boolean {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Sends an email via configured SMTP settings.
 * Never throws: returns { sent: boolean, reason?: string } so transient mail
 * failures never block registration or critical workflows.
 */
export async function sendEmailSafe(options: EmailOptions): Promise<{ sent: boolean; reason?: string }> {
    try {
        if (!isMailerConfigured()) {
            return { sent: false, reason: 'SMTP not configured' };
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT || 587) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Switch Code Community" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        return { sent: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown email error';
        console.error('[Mailer] Safe send failed:', message);
        return { sent: false, reason: message };
    }
}
