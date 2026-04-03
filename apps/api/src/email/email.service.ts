import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const privateEmail = this.configService.get<string>('PRIVATE_EMAIL_USER');     // например: info@kino-kot.com
    const privatePassword = this.configService.get<string>('PRIVATE_EMAIL_PASSWORD');

    if (privateEmail && privatePassword) {
      this.transporter = createTransport({
        host: 'mail.privateemail.com',
        port: 465,                    // или 587 — попробуй оба
        secure: true,                 // true для 465, false для 587 + STARTTLS
        family: 4,                    // ← важно! заставляем использовать только IPv4
        auth: {
          user: privateEmail,
          pass: privatePassword,
        },
      } as SMTPTransport.Options);

      this.fromEmail = `КиноКот <${privateEmail}>`;
    } else {
      this.fromEmail = 'КиноКот <noreply@kino-kot.com>';
      this.logger.warn('PRIVATE_EMAIL_USER / PRIVATE_EMAIL_PASSWORD не заданы — письма только в консоль');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    const subject = 'Подтвердите ваш email — КиноКот';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e;">Добро пожаловать в КиноКот! 🐱</h2>
        <p>Для завершения регистрации подтвердите ваш email, нажав на кнопку ниже:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Подтвердить email
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Если вы не регистрировались на КиноКот, просто проигнорируйте это письмо.
        </p>
      </div>
    `;

    this.logger.log('=== VERIFICATION EMAIL ===');
    this.logger.log(`To: ${to}`);
    this.logger.log(`Link: ${verifyUrl}`);
    this.logger.log('==========================');

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
        });
        this.logger.log(`Письмо подтверждения отправлено на ${to}`);
      } catch (error) {
        this.logger.error(`Ошибка отправки письма на ${to}`, error);
      }
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    const subject = 'Сброс пароля — КиноКот';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e;">Сброс пароля 🐱</h2>
        <p>Вы запросили сброс пароля на КиноКот. Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Сбросить пароль
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        </p>
      </div>
    `;

    this.logger.log('=== PASSWORD RESET EMAIL ===');
    this.logger.log(`To: ${to}`);
    this.logger.log(`Link: ${resetUrl}`);
    this.logger.log('============================');

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
        });
        this.logger.log(`Письмо сброса пароля отправлено на ${to}`);
      } catch (error) {
        this.logger.error(`Ошибка отправки письма на ${to}`, error);
      }
    }
  }
}
