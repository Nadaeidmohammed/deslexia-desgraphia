import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionProvider } from '../providers/submission.provider';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { UpdateSubmissionDto } from '../dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly submissionProvider: SubmissionProvider) {}

  async submitExercise(dto: CreateSubmissionDto) {
    // 1. هنا مستقبلاً سنقوم بمناداة موديول الـ AI لتحليل الـ fileUrl
    // 2. الـ AI سيرجع لنا الـ Score والـ Feedback
    
    // حالياً سنخزن البيانات مباشرة
    return this.submissionProvider.create(dto);
  }

  async getChildProgress(childId: number) {
    return this.submissionProvider.findByChild(childId);
  }

  async update(id: number, dto: UpdateSubmissionDto) {
    const submission = await this.submissionProvider.findOne(id);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission.update(dto);
  }
}