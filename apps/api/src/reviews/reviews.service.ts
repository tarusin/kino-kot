import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schemas/review.schema.js';
import { ReviewReaction } from './schemas/review-reaction.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewReaction.name)
    private reactionModel: Model<ReviewReaction>,
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

  async toggleReaction(userId: string, dto: ToggleReactionDto) {
    const userOid = new Types.ObjectId(userId);
    const reviewOid = new Types.ObjectId(dto.reviewId);

    const existing = await this.reactionModel.findOne({
      userId: userOid,
      reviewId: reviewOid,
    });

    if (existing) {
      if (existing.type === dto.type) {
        await existing.deleteOne();
      } else {
        existing.type = dto.type;
        await existing.save();
      }
    } else {
      await this.reactionModel.create({
        userId: userOid,
        reviewId: reviewOid,
        type: dto.type,
      });
    }

    const [likesCount, dislikesCount] = await Promise.all([
      this.reactionModel.countDocuments({ reviewId: reviewOid, type: 'like' }),
      this.reactionModel.countDocuments({
        reviewId: reviewOid,
        type: 'dislike',
      }),
    ]);

    const current = await this.reactionModel.findOne({
      userId: userOid,
      reviewId: reviewOid,
    });

    return {
      likesCount,
      dislikesCount,
      userReaction: current?.type || null,
    };
  }

  async findByUser(userId: string, page: number, limit: number) {
    const userOid = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const result = await this.reviewModel.aggregate([
      { $match: { userId: userOid } },
      { $sort: { createdAt: -1 as const } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          reviews: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'movies',
                localField: 'movieId',
                foreignField: '_id',
                as: 'movie',
              },
            },
            { $unwind: '$movie' },
            {
              $project: {
                rating: 1,
                text: 1,
                userName: 1,
                createdAt: 1,
                movie: {
                  _id: '$movie._id',
                  title: '$movie.title',
                  posterPath: '$movie.posterPath',
                },
              },
            },
          ],
        },
      },
    ]);

    const { metadata, reviews } = result[0];
    const total = metadata[0]?.total || 0;

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByMovie(movieId: string, userId?: string) {
    const movieOid = new Types.ObjectId(movieId);

    const pipeline: any[] = [
      { $match: { movieId: movieOid } },
      { $sort: { createdAt: -1 as const } },
      {
        $lookup: {
          from: 'reviewreactions',
          localField: '_id',
          foreignField: 'reviewId',
          as: 'reactions',
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.type', 'like'] },
              },
            },
          },
          dislikesCount: {
            $size: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.type', 'dislike'] },
              },
            },
          },
        },
      },
    ];

    if (userId) {
      const userOid = new Types.ObjectId(userId);
      pipeline.push({
        $addFields: {
          userReaction: {
            $let: {
              vars: {
                match: {
                  $filter: {
                    input: '$reactions',
                    cond: { $eq: ['$$this.userId', userOid] },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$match' }, 0] },
                  then: { $arrayElemAt: ['$$match.type', 0] },
                  else: null,
                },
              },
            },
          },
        },
      });
    } else {
      pipeline.push({ $addFields: { userReaction: null } });
    }

    pipeline.push({
      $project: {
        reactions: 0,
      },
    });

    return this.reviewModel.aggregate(pipeline);
  }
}
