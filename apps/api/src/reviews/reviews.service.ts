import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schemas/review.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async create(
    userId: string,
    userName: string,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const existing = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      movieId: new Types.ObjectId(dto.movieId),
    });

    if (existing) {
      throw new ConflictException('Вы уже оставили отзыв на этот фильм');
    }

    return this.reviewModel.create({
      userId: new Types.ObjectId(userId),
      movieId: new Types.ObjectId(dto.movieId),
      rating: dto.rating,
      text: dto.text,
      userName,
    });
  }

  async findByMovie(movieId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ movieId: new Types.ObjectId(movieId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
