import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Submission } from './entities/submission.entity';
import { SubmissionService } from './services/submission.service';
import { SubmissionProvider } from './providers/submission.provider';
import { SubmissionController } from './controllers/submission.controller';

@Module({
  imports: [SequelizeModule.forFeature([Submission])],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionProvider],
  exports: [SubmissionService],
})
export class SubmissionModule {}
