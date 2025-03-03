import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email');
    }
}

export function getPasswordResetEmail(resetLink: string) {
    return `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
    `;
}

export function getVerificationEmail(verifyLink: string) {
    return `
        <h1>Verify Your Email</h1>
        <p>Click the link below to verify your email address.</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>If you didn't create this account, you can safely ignore this email.</p>
    `;
}

export function get2FAEmail(code: string) {
    return `
        <h1>Your 2FA Code</h1>
        <p>Use the following code to complete your login:</p>
        <h2 style="font-size: 24px; letter-spacing: 2px;">${code}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't try to login, someone may be trying to access your account.</p>
    `;
}
