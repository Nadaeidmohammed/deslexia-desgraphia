import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubmissionService } from '../services/submission.service';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  // CREATE
  @Post()
  @ApiOperation({
    summary: 'Create submission',
    description: 'Flutter sends exercise result after child finishes activity',
  })
  create(@Body() dto: CreateSubmissionDto, @Request() req) {
    return this.submissionService.create(dto, req.user.userId);
  }

  // GET BY CHILD
  @Get('child/:childId')
  findByChild(@Param('childId', ParseIntPipe) childId: number, @Request() req) {
    return this.submissionService.findByChild(childId, req.user.userId);
  }
  // GET REPORT
  @Get('report/:childId')
  @ApiOperation({
    summary: 'Get child dashboard report',
    description:
      'Returns stats, chart, alerts, letters to practice and activities',
  })
  getReport(@Param('childId', ParseIntPipe) childId: number, @Request() req) {
    return this.submissionService.getReport(childId, req.user.userId);
  }
}
