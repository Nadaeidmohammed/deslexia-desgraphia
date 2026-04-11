import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ChatProvider } from './providers/chat.provider';
import { ChatGateway } from './gateways/chat.gateway';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Conversation, Message]),
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatProvider, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
