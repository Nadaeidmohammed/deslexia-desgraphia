import { Injectable } from '@nestjs/common';
import { SubmissionProvider } from '../providers/submission.provider';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { UpdateSubmissionDto } from '../dto/update-submission.dto';

@Injectable()
export class SubmissionService {
  constructor(private readonly submissionProvider: SubmissionProvider) {}

  // CREATE
  async create(dto: CreateSubmissionDto) {
    return this.submissionProvider.create(dto);
  }

  // GET ALL
  async findAll() {
    return this.submissionProvider.findAll();
  }

  // GET BY CHILD
  async findByChild(childId: number) {
    return this.submissionProvider.findByChild(childId);
  }

  // UPDATE
  async update(id: number, dto: UpdateSubmissionDto) {
    return this.submissionProvider.update(id, dto);
  }

  // DELETE
  async delete(id: number) {
    return this.submissionProvider.delete(id);
  }

  async getReport(childId: number) {
    const submissions =
      await this.submissionProvider.findByChildWithChild(childId);

    if (!submissions.length) {
      return { message: 'No data yet' };
    }
    const child = submissions[0].child;
    const parent = child.parent;
    const age =
      new Date().getFullYear() - new Date(child.birthDate).getFullYear();

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
    const alerts = [];

    if (stats.reading.percentage < 40) {
      alerts.push({
        id: 1,
        type: 'warning',
        text: 'مستوى القراءة يحتاج إلى دعم وتحسين',
      });
    }

    if (stats.writing.percentage < 40) {
      alerts.push({
        id: 2,
        type: 'warning',
        text: 'مستوى الكتابة يحتاج إلى مزيد من التدريب',
      });
    }

    if (stats.listening.percentage < 40) {
      alerts.push({
        id: 3,
        type: 'warning',
        text: 'مهارات الاستماع تحتاج إلى تطوير',
      });
    }

    if (
      stats.reading.percentage > 70 &&
      stats.writing.percentage > 70 &&
      stats.listening.percentage > 70
    ) {
      alerts.push({
        id: 4,
        type: 'info',
        text: 'أداء الطفل ممتاز 👏 استمروا!',
      });
    }

    if (stats.writing.percentage < 30) {
      alerts.push({
        id: 1,
        type: 'warning',
        text: 'مستوى الكتابة يحتاج دعم',
      });
    }

    // activities
    const activities = [];

    let id = 1;

    // لو القراءة ضعيفة
    if (stats.reading.percentage < 50) {
      activities.push({
        id: id++,
        type: 'reading',
        text: 'تمرين قراءة كلمات بسيطة',
      });
    }

    // لو الكتابة ضعيفة
    if (stats.writing.percentage < 50) {
      activities.push({
        id: id++,
        type: 'writing',
        text: 'تمرين كتابة الحروف الأساسية',
      });
    }

    // لو الاستماع ضعيف
    if (stats.listening.percentage < 50) {
      activities.push({
        id: id++,
        type: 'listening',
        text: 'تمرين استماع وتمييز الأصوات',
      });
    }

    if (activities.length === 0) {
      activities.push({
        id: id++,
        type: 'advanced',
        text: 'تمارين متقدمة لتحسين المهارات',
      });
    }

    return {
      parentEmail: parent.email,
      childName: child.name,
      age: age,
      lastEvaluation: submissions[submissions.length - 1].createdAt,

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
