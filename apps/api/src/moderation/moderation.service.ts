import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from '../reviews/schemas/review.schema.js';
import { ReviewComment } from '../reviews/schemas/review-comment.schema.js';

interface ModerationResult {
  status: 'approved' | 'pending';
  reason?: string;
}

// Русский мат и оскорбления — основы + вариации с заменами символов
// Каждый паттерн — RegExp-строка, проверяется с флагом i (регистронезависимо)
const PROFANITY_PATTERNS: string[] = [
  // Основные матерные корни и их вариации
  'х[уyу][йиeёя]',
  'х[уyу][ил]',
  'х[уyу][ёе]в',
  'п[иi]зд',
  'п[иi]з[дd]',
  'бл[яяa][тtд]',
  'бл[яa]д',
  'е[бb6][аa@лиу]',
  'ё[бb6]',
  '[её][бb6][аa@лиуонт]',
  '[её][бb6]а[тнл]',
  'с[уy][кk][аa@иi]',
  'м[уy]д[аa@оo][кkзн]',
  'д[еe]р[ьъ]м',
  'г[аa@]вн[оo0]',
  'г[оo0]вн',
  'за[лl][уy]п',
  'п[иi]д[аоeе]р',
  'п[еe]д[иiо]к',
  'п[еe]д[рp]',
  'г[аa]нд[оo0]н',
  'ш[лl][юy][хx]',
  'др[оo0]ч',
  'мандa',
  'манд[аa]вошк',
  'с[рp][аa@]н',
  'с[рp][аa@]ть',
  'ж[оo0]п[аa@уы]',
  'х[еe]р[нн]',
  'х[еe]р[оo0]в',
  'н[аa@]х[уy][йиeё]',
  'п[оo0]х[уy][йиeё]',
  'зае[бb6]',
  'отъ[еe][бb6]',
  'у[ёе][бb6][аоиk]',
  'д[оo0]л[бb6][оo0][ёе][бb6]',
  'тв[аa@]р[ьъ]',

  // Оскорбления
  'д[аa@]ун',
  'д[еe]б[иi]л',
  'идиот',
  'кр[еe]т[иi]н',
  'у[рp][оo0]д',
  'отст[аa@]л',
  'т[уy]п[оo0][йиeёр]',
  'т[уy]п[аa@я]',
  'т[уy]п[ыi][еeйх]',

  // Разжигание ненависти
  'ч[уy]рк',
  'ч[еe]рн[оo0]ж[оo0]п',
  'х[оo0]х[оo0]л',
  'к[аa@]ц[аa@]п',
  'ж[иi]д[оo0ыаa@]',
  'н[иi]г[еe]р',
  'н[еe]гр[иi]л',
];

const SPAM_PATTERNS: string[] = [
  // Ссылки и реклама
  'https?://',
  'www\\.',
  'заработ[аa@][йитьк]',
  'к[аa@]з[иi]н[оo0]',
  'ст[аa@]вк[иi]',
  'бет[тt]',
  'скидк[аиу]',
  'промокод',
  'переход[иi] по',
  'подп[иi]с[ыиь]',
  'т[еe]л[еe]гр[аa@]м',
];

class WordFilter {
  private profanityRegexes: RegExp[];
  private spamRegexes: RegExp[];

  constructor() {
    this.profanityRegexes = PROFANITY_PATTERNS.map(
      (p) => new RegExp(p, 'iu'),
    );
    this.spamRegexes = SPAM_PATTERNS.map((p) => new RegExp(p, 'iu'));
  }

  check(text: string): ModerationResult {
    // Нормализуем: убираем повторяющиеся символы (ууууу → уу), заменяем цифры-двойники
    const normalized = text
      .replace(/(.)\1{2,}/g, '$1$1')
      .replace(/0/g, 'о')
      .replace(/3/g, 'з')
      .replace(/1/g, 'и')
      .replace(/@/g, 'а');

    for (const regex of this.profanityRegexes) {
      if (regex.test(text) || regex.test(normalized)) {
        return {
          status: 'pending',
          reason: 'Обнаружена ненормативная лексика',
        };
      }
    }

    for (const regex of this.spamRegexes) {
      if (regex.test(text) || regex.test(normalized)) {
        return { status: 'pending', reason: 'Подозрение на спам/рекламу' };
      }
    }

    return { status: 'approved' };
  }
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly wordFilter = new WordFilter();

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewComment.name)
    private commentModel: Model<ReviewComment>,
  ) {}

  moderateText(text: string): ModerationResult {
    const result = this.wordFilter.check(text);
    if (result.status === 'pending') {
      this.logger.log(
        `Текст заблокирован (${text.length} символов): ${result.reason}`,
      );
    }
    return result;
  }

  async getPendingReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel.aggregate([
        { $match: { status: 'pending' } },
        { $sort: { createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'movies',
            localField: 'movieId',
            foreignField: 'compositeId',
            as: 'movie',
          },
        },
        { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            userId: 1,
            movieId: 1,
            rating: 1,
            text: 1,
            userName: 1,
            createdAt: 1,
            moderationReason: 1,
            movieTitle: '$movie.title',
            moviePosterPath: '$movie.posterPath',
          },
        },
      ]),
      this.reviewModel.countDocuments({ status: 'pending' }),
    ]);

    return { reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPendingComments(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.commentModel.aggregate([
        { $match: { status: 'pending' } },
        { $sort: { createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'reviews',
            localField: 'reviewId',
            foreignField: '_id',
            as: 'review',
          },
        },
        { $unwind: { path: '$review', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            userId: 1,
            reviewId: 1,
            text: 1,
            userName: 1,
            createdAt: 1,
            moderationReason: 1,
            reviewText: { $substr: ['$review.text', 0, 100] },
          },
        },
      ]),
      this.commentModel.countDocuments({ status: 'pending' }),
    ]);

    return { comments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async moderateReview(
    reviewId: string,
    action: 'approved' | 'rejected',
    reason?: string,
  ) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    review.status = action;
    if (reason) {
      review.moderationReason = reason;
    }
    await review.save();

    return { message: `Отзыв ${action === 'approved' ? 'одобрен' : 'отклонён'}` };
  }

  async moderateComment(
    commentId: string,
    action: 'approved' | 'rejected',
    reason?: string,
  ) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    comment.status = action;
    if (reason) {
      comment.moderationReason = reason;
    }
    await comment.save();

    return {
      message: `Комментарий ${action === 'approved' ? 'одобрен' : 'отклонён'}`,
    };
  }

  async getStats() {
    const [pendingReviews, pendingComments] = await Promise.all([
      this.reviewModel.countDocuments({ status: 'pending' }),
      this.commentModel.countDocuments({ status: 'pending' }),
    ]);

    return { pendingReviews, pendingComments };
  }

  async getStatsWithReports(pendingReports: number) {
    const stats = await this.getStats();
    return { ...stats, pendingReports };
  }
}
