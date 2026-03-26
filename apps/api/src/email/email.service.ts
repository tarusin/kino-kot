import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (gmailUser && gmailAppPassword) {
      this.transporter = createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
      this.fromEmail = `КиноКот <${gmailUser}>`;
    } else {
      this.fromEmail = 'КиноКот <noreply@kinokot.ru>';
      this.logger.warn(
        'GMAIL_USER / GMAIL_APP_PASSWORD не заданы — письма будут выводиться только в консоль',
      );
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
}
