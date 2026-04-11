import { Controller, Get, Query, Param, UseGuards, Delete, Patch, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExercisesService } from '../services/exercises.service'; 
import { Roles } from 'src/auth/decorators';
import { UpdateExerciseDto } from '../dto';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  async getAll(@Query('type') type: string) {
    return this.exercisesService.findAll(type);
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.exercisesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an exercise (Admin only)' })
  async update(@Param('id') id: number, @Body() updateExerciseDto: UpdateExerciseDto) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an exercise (Admin only)' })
  async remove(@Param('id') id: number) {
    return this.exercisesService.remove(id);
  }
}