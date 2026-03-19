import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from './movies/movies.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kinokot',
      }),
    }),
    MoviesModule,
  ],
})
export class AppModule {}
