import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubmissionsService } from '../services/submission.service';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit exercise result (from Mobile/Web)' })
  async create(@Body() dto: CreateSubmissionDto) {
    return this.submissionsService.submitExercise(dto);
  }

  @Get('child/:childId')
  @ApiOperation({ summary: 'Get all submissions for a specific child' })
  async getProgress(@Param('childId') childId: number) {
    return this.submissionsService.getChildProgress(childId);
  }
}