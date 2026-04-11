import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Child } from './entities/child.entity';
import { ChildrenController } from './controllers/child.controller';
import { ChildrenService } from './services/child.service';
import { ChildProvider } from './providers/child.provider';

@Module({
  imports: [SequelizeModule.forFeature([Child])],
  controllers: [ChildrenController],
  providers: [ChildrenService, ChildProvider],
  exports: [ChildrenService],
})
export class ChildrenModule {}
