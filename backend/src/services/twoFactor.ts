// src/services/twoFactor.ts  — TOTP-based 2FA using otplib

import * as otplib from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { BadRequestError, NotFoundError } from '@/utils/errors';

const APP_NAME = 'Pragyan AI';

export const twoFactorService = {
  /**
   * Generate a new TOTP secret + QR code.
   * The secret is NOT saved until enable() is called successfully.
   */
  async generateSecret(userId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundError('User not found');

    const secret = otplib.generateSecret();
    const otpauthUrl =
      `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(user.email)}` +
      `?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}`;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrDataUrl };
  },

  /** Verify a TOTP code against a secret. */
  async verifyCode(secret: string, token: string): Promise<boolean> {
    try {
      const result = await otplib.verify({ token: token.replace(/\s/g, ''), secret });
      return typeof result === 'object' ? result.valid === true : Boolean(result);
    } catch {
      return false;
    }
  },

  /** Enable 2FA: verify the user's first code, then persist the secret. */
  async enable(userId: string, secret: string, token: string): Promise<void> {
    const valid = await this.verifyCode(secret, token);
    if (!valid) throw new BadRequestError('Invalid verification code. Please try again.');
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });
  },

  /** Disable 2FA: require a valid current TOTP code. */
  async disable(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!user) throw new NotFoundError('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError('2FA is not enabled on this account.');
    }
    const valid = await this.verifyCode(user.twoFactorSecret, token);
    if (!valid) throw new BadRequestError('Invalid verification code.');
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });
  },

  /** Validate a TOTP token during login (returns true if 2FA not enabled). */
  async validateLogin(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) return true;
    return this.verifyCode(user.twoFactorSecret, token);
  },

  async getStatus(userId: string): Promise<{ enabled: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return { enabled: Boolean(user?.twoFactorEnabled) };
  },
};
