import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './user.schema.js';
import { Review } from '../reviews/schemas/review.schema.js';
import { ReviewReaction } from '../reviews/schemas/review-reaction.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewReaction.name)
    private reactionModel: Model<ReviewReaction>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    emailVerificationToken?: string;
  }): Promise<User> {
    return this.userModel.create(data);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userModel.findOne({ emailVerificationToken: token });
  }

  async updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAccount(id: string): Promise<void> {
    const userOid = new Types.ObjectId(id);

    const userReviews = await this.reviewModel.find({ userId: userOid }).select('_id');
    const reviewIds = userReviews.map((r) => r._id);

    await Promise.all([
      this.reviewModel.deleteMany({ userId: userOid }),
      this.reactionModel.deleteMany({
        $or: [{ userId: userOid }, { reviewId: { $in: reviewIds } }],
      }),
    ]);

    await this.userModel.findByIdAndDelete(id);
  }
}
