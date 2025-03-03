import { authenticator } from '@otplib/preset-default';
import { generateSecret } from 'node-2fa';
import QRCode from 'qrcode';
import { db } from '@astrojs/db';
import { users } from './auth';

export async function setup2FA(userId: string) {
    // Generate new secret
    const secret = generateSecret({
        name: 'YakCMS',
        account: userId,
    });

    // Save secret to user record
    await db.update(users).set({
        twoFactorSecret: secret.secret,
        twoFactorEnabled: false, // Not enabled until verified
    }).where(sql`id = ${userId}`);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.uri);

    return {
        secret: secret.secret,
        qrCode,
    };
}

export async function verify2FASetup(userId: string, token: string) {
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.twoFactorSecret) {
        throw new Error('2FA not set up');
    }

    const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
    });

    if (!isValid) {
        throw new Error('Invalid token');
    }

    // Enable 2FA
    await db.update(users).set({
        twoFactorEnabled: true,
    }).where(sql`id = ${userId}`);

    return true;
}

export async function verify2FAToken(userId: string, token: string) {
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
        throw new Error('2FA not enabled');
    }

    return authenticator.verify({
        token,
        secret: user.twoFactorSecret,
    });
}

export async function disable2FA(userId: string) {
    await db.update(users).set({
        twoFactorSecret: null,
        twoFactorEnabled: false,
    }).where(sql`id = ${userId}`);
}

// For email-based 2FA
export function generateEmailToken() {
    return authenticator.generate(authenticator.generateSecret());
}

export async function storeEmailToken(userId: string, token: string) {
    await db.insert(twoFactorTokens).values({
        userId,
        token,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
}

export async function verifyEmailToken(userId: string, token: string) {
    const storedToken = await db.query.twoFactorTokens.findFirst({
        where: (tokens, { and, eq }) => and(
            eq(tokens.userId, userId),
            eq(tokens.token, token),
            sql`expires > CURRENT_TIMESTAMP`
        ),
    });

    if (!storedToken) {
        return false;
    }

    // Delete used token
    await db.delete(twoFactorTokens).where(sql`id = ${storedToken.id}`);

    return true;
}
