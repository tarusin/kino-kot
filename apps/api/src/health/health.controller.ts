import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  check() {
    const dbState = this.connection.readyState;

    return {
      status: dbState === 1 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbState === 1 ? 'connected' : 'disconnected',
      },
    };
  }
}
