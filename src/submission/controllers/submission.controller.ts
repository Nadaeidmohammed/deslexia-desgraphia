import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SubmissionService } from '../services/submission.service';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { UpdateSubmissionDto } from '../dto/update-submission.dto';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateSubmissionDto) {
    return this.submissionService.create(dto);
  }

  // GET ALL
  @Get()
  findAll() {
    return this.submissionService.findAll();
  }

  // GET BY CHILD
  @Get('child/:childId')
  findByChild(@Param('childId', ParseIntPipe) childId: number) {
    return this.submissionService.findByChild(childId);
  }

  // UPDATE
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.submissionService.update(id, dto);
  }

  // DELETE
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.submissionService.delete(id);
  }
  @Get('report/:childId')
  getReport(@Param('childId', ParseIntPipe) childId: number) {
    return this.submissionService.getReport(childId);
  }
}
