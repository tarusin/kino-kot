import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { EmailService } from '../email/email.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email уже занят');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = randomUUID();

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      emailVerificationToken,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
    );

    return {
      message: 'Проверьте вашу почту для подтверждения email',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Недействительная ссылка подтверждения');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined as any;
    await user.save();

    return { message: 'Email успешно подтверждён' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.isEmailVerified) {
      return { message: 'Email уже подтверждён' };
    }

    const newToken = randomUUID();
    user.emailVerificationToken = newToken;
    await user.save();

    await this.emailService.sendVerificationEmail(user.email, newToken);

    return { message: 'Письмо отправлено повторно' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const id = user._id.toString();
    const tokens = this.generateTokens(id);
    return {
      user: {
        id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
      ...tokens,
    };
  }

  generateTokens(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user._id.toString());
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
    };
  }
}
