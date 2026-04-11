import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Put,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ChildrenService } from '../services/child.service';

@ApiTags('Children')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/children')
export class ChildrenController {
  constructor(private readonly service: ChildrenService) { }

  @Post()
  @ApiOperation({ summary: 'Create child' })
  @ApiResponse({ status: 201, description: 'The child has been successfully created.' })
  create(@CurrentUser() user: any, @Body() dto: CreateChildDto) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all children for the logged-in parent' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAllByParent(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific child by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update child information' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChildDto,
  ) {
    return this.service.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a child' })
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id, user.userId);
  }
}