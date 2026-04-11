import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SubmissionProvider } from './providers/submission.provider';
import { Submission } from './entities/submission.entity';
import { SubmissionsController } from './controllers/submission.controller';
import { SubmissionsService } from './services/submission.service';

@Module({
  imports: [SequelizeModule.forFeature([Submission])],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionProvider],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}