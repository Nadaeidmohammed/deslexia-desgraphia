import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionProvider } from '../providers/submission.provider';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Child } from '../../child/entities/child.entity';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionProvider: SubmissionProvider,

    @InjectModel(Child)
    private readonly childModel: typeof Child,
  ) { }

  // CREATE

  async create(dto: CreateSubmissionDto, parentId: number) {
    const child = await this.childModel.findByPk(dto.childId);

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (Number(child.parentId) !== Number(parentId)) {
      throw new ForbiddenException('You cannot add data to this child');
    }

    return this.submissionProvider.create(dto);
  }

  // GET BY CHILD
  async findByChild(childId: number, parentId: number) {
    const submissions =
      await this.submissionProvider.findByChildWithChild(childId);

    if (!submissions.length) {
      return [];
    }

    const child = submissions[0].child;

    if (Number(child.parentId) !== Number(parentId)) {
      console.log('Mismatch:', child.parentId, parentId);
      throw new ForbiddenException('You cannot access this child data');
    }

    return submissions;
  }

  async getReport(childId: number, parentId: number) {
    const submissions =
      await this.submissionProvider.findByChildWithChild(childId);

    if (!submissions.length) {
      return { message: 'No data yet' };
    }
    const child = submissions[0].child;
    if (child.parentId !== parentId) {
      throw new ForbiddenException('You cannot access this child data');
    }
    const parent = child.parent;
    let age = 0;
    if (child.birthDate) {
      try {
        const bDate = new Date(child.birthDate);

        if (!isNaN(bDate.getTime()) && bDate.getFullYear() > 1900) {
          age = 2026 - bDate.getFullYear();
          console.log('TRACE: Method 1 (Date Object) worked. Year:', bDate.getFullYear());
        }
        else {
          const dateStr = String(child.birthDate);
          const yearMatch = dateStr.match(/\d{4}/);
          if (yearMatch) {
            const year = parseInt(yearMatch[0], 10);
            age = 2026 - year;
            console.log('TRACE: Method 2 (Regex) worked. Year:', year);
          }
        }
      } catch (e) {
        console.error('TRACE: Age calculation crashed:', e);
      }
    }
    // stats
    const stats = {
      reading: this.calculateType(submissions, 'reading'),
      writing: this.calculateType(submissions, 'writing'),
      listening: this.calculateType(submissions, 'listening'),
    };

    // chart
    const lastSubmissions = submissions.slice(-3);

    const chartData = lastSubmissions.map((s, index) => {
      const total = s.totalItems || 0;
      const mistakes = (s.mistakes || []).length;

      const score =
        total > 0 ? Math.round(((total - mistakes) / total) * 100) : 0;

      return {
        evaluationName: `تقييم ${index + 1}`,

        reading: s.exerciseType === 'reading' ? score : 0,
        writing: s.exerciseType === 'writing' ? score : 0,
        focus: s.exerciseType === 'listening' ? score : 0,
      };
    });

    // letters
    const mistakes = submissions.flatMap((s) => s.mistakes || []);

    // count كل حرف
    const frequencyMap: Record<string, number> = {};

    for (const letter of mistakes) {
      frequencyMap[letter] = (frequencyMap[letter] || 0) + 1;
    }

    // ترتيب حسب التكرار
    const sortedLetters = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .map(([letter]) => letter);

    // خد أهم 5
    const lettersToPractice = sortedLetters.slice(0, 5);
    // alerts
    const alerts: any[] = [];

    let alertId = 1;

    // reading
    if (stats.reading.percentage < 40) {
      alerts.push({
        id: alertId++,
        type: 'warning',
        text: 'مستوى القراءة يحتاج إلى دعم وتحسين',
      });
    }

    // writing
    if (stats.writing.percentage < 30) {
      alerts.push({
        id: alertId++,
        type: 'warning',
        text: 'مستوى الكتابة ضعيف جدًا ويحتاج متابعة مستمرة',
      });
    } else if (stats.writing.percentage < 40) {
      alerts.push({
        id: alertId++,
        type: 'warning',
        text: 'مستوى الكتابة يحتاج إلى مزيد من التدريب',
      });
    }

    // listening
    if (stats.listening.percentage < 40) {
      alerts.push({
        id: alertId++,
        type: 'warning',
        text: 'مهارات الاستماع تحتاج إلى تطوير',
      });
    }

    // ممتاز
    if (
      stats.reading.percentage >= 70 &&
      stats.writing.percentage >= 70 &&
      stats.listening.percentage >= 70
    ) {
      alerts.push({
        id: alertId++,
        type: 'info',
        text: 'أداء الطفل ممتاز 👏 استمروا!',
      });
    }

    // activities

    const activities: any[] = [];

    let id = 1;

    // reading
    if (stats.reading.percentage < 50) {
      activities.push({
        id: id++,
        type: 'reading',
        text: 'تمرين قراءة كلمات بسيطة وتحسين النطق',
      });
    }

    // writing
    if (stats.writing.percentage < 50) {
      activities.push({
        id: id++,
        type: 'writing',
        text: 'تمرين كتابة الحروف الأساسية بخط واضح',
      });
    }

    // listening
    if (stats.listening.percentage < 50) {
      activities.push({
        id: id++,
        type: 'listening',
        text: 'تمرين استماع وتمييز الأصوات المتشابهة',
      });
    }

    // letters practice
    if (lettersToPractice.length > 0) {
      activities.push({
        id: id++,
        type: 'letters',
        text: `مراجعة الحروف: ${lettersToPractice.join(' - ')}`,
      });
    }

    // لو كله ممتاز
    if (activities.length === 0) {
      activities.push({
        id: id++,
        type: 'advanced',
        text: 'تمارين متقدمة لزيادة السرعة والدقة',
      });
    }

    return {
      parentEmail: parent.email,
      childName: child.name,
      age: age,
      lastEvaluation: new Date(
        submissions[submissions.length - 1].createdAt,
      ).toLocaleDateString('ar-EG'),

      stats,
      chartData,
      lettersToPractice,
      alerts,
      activities,
    };
  }
  private calculateType(submissions: any[], type: string) {
    const filtered = submissions.filter((s) => s.exerciseType === type);

    if (!filtered.length) {
      return { percentage: 0, status: 'ضعيف' };
    }

    let totalScore = 0;
    let count = 0;

    for (const s of filtered) {
      const total = s.totalItems || 0;
      const mistakesCount = (s.mistakes || []).length;

      if (total > 0) {
        const score = ((total - mistakesCount) / total) * 100;
        totalScore += score;
        count++;
      }
    }

    const percentage = count ? Math.round(totalScore / count) : 0;

    let status = 'ضعيف';

    if (percentage >= 70) status = 'جيد';
    else if (percentage >= 40) status = 'متوسط';

    return { percentage, status };
  }
}
