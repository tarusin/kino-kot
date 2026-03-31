import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema.js';
import { Review } from '../reviews/schemas/review.schema.js';
import { ReviewComment } from '../reviews/schemas/review-comment.schema.js';
import { CreateReportDto } from './dto/create-report.dto.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewComment.name) private commentModel: Model<ReviewComment>,
  ) {}

  async create(userId: string, dto: CreateReportDto) {
    const targetObjectId = new Types.ObjectId(dto.targetId);

    // Проверяем существование контента
    if (dto.targetType === 'review') {
      const review = await this.reviewModel.findById(targetObjectId);
      if (!review) throw new NotFoundException('Отзыв не найден');
    } else {
      const comment = await this.commentModel.findById(targetObjectId);
      if (!comment) throw new NotFoundException('Комментарий не найден');
    }

    try {
      const report = await this.reportModel.create({
        userId: new Types.ObjectId(userId),
        targetId: targetObjectId,
        targetType: dto.targetType,
        reason: dto.reason,
        description: dto.description,
      });
      return { message: 'Жалоба отправлена', reportId: report._id };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('Вы уже пожаловались на этот контент');
      }
      throw err;
    }
  }

  async findPending(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.reportModel.aggregate([
        { $match: { status: 'pending' } },
        { $sort: { createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'reporter',
          },
        },
        { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
        // Lookup для отзывов
        {
          $lookup: {
            from: 'reviews',
            localField: 'targetId',
            foreignField: '_id',
            as: 'reviewTarget',
          },
        },
        // Lookup для комментариев
        {
          $lookup: {
            from: 'reviewcomments',
            localField: 'targetId',
            foreignField: '_id',
            as: 'commentTarget',
          },
        },
        {
          $project: {
            _id: 1,
            targetId: 1,
            targetType: 1,
            reason: 1,
            description: 1,
            createdAt: 1,
            reporterName: '$reporter.name',
            // Данные контента в зависимости от targetType
            contentText: {
              $cond: {
                if: { $eq: ['$targetType', 'review'] },
                then: { $arrayElemAt: ['$reviewTarget.text', 0] },
                else: { $arrayElemAt: ['$commentTarget.text', 0] },
              },
            },
            contentAuthor: {
              $cond: {
                if: { $eq: ['$targetType', 'review'] },
                then: { $arrayElemAt: ['$reviewTarget.userName', 0] },
                else: { $arrayElemAt: ['$commentTarget.userName', 0] },
              },
            },
          },
        },
      ]),
      this.reportModel.countDocuments({ status: 'pending' }),
    ]);

    return { reports, total, page, totalPages: Math.ceil(total / limit) };
  }

  async resolve(reportId: string, action: 'dismiss' | 'delete-content') {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Жалоба не найдена');

    if (action === 'delete-content') {
      // Удаляем контент
      if (report.targetType === 'review') {
        await this.reviewModel.findByIdAndDelete(report.targetId);
      } else {
        await this.commentModel.findByIdAndDelete(report.targetId);
      }
      // Закрываем все жалобы на этот контент
      await this.reportModel.updateMany(
        { targetId: report.targetId, status: 'pending' },
        { status: 'resolved' },
      );
      return { message: 'Контент удалён, жалобы закрыты' };
    }

    // dismiss — просто закрываем эту жалобу
    report.status = 'resolved';
    await report.save();
    return { message: 'Жалоба отклонена' };
  }

  async getPendingCount(): Promise<number> {
    return this.reportModel.countDocuments({ status: 'pending' });
  }
}
