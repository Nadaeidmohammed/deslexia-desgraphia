import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true, // بورت 465 يحتاج لـ true
      auth: {
        user: 'resend', // كلمة ثابتة في Resend
        pass: this.configService.get<string>('MAIL_PASS'),
      },
      // إعدادات الربط مع Railway
      connectionTimeout: 10000,
      options: {
        family: 4 // إجبار IPv4 لتجنب مشاكل الشبكة
      }
    } as any);
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    // في النسخة المجانية من Resend، لازم الـ From يكون onboarding@resend.dev
    // إلا لو ربطتي دومين خاص بيكي
    const from = 'onboarding@resend.dev';

    try {
      await this.transporter.sendMail({
        from: `"Qupedia Support" <${from}>`,
        to: email,
        subject: 'Email Verification Code',
        html: `
          <div style="font-family: Arial; text-align: center; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #333;">Welcome to Qupedia!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4A90E2; font-size: 40px; letter-spacing: 5px;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Email sent successfully via Resend to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Resend Failed: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    const from = 'onboarding@resend.dev';

    try {
      await this.transporter.sendMail({
        from: `"Qupedia Support" <${from}>`,
        to: email,
        subject: 'Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center;">
            <h2>Password Reset</h2>
            <p>You requested a password reset. Here is your 6-digit code:</p>
            <h1 style="color: #E24A4A; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 15 minutes.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Reset email sent via Resend to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Resend Reset Failed: ${error.message}`);
    }
  }
}