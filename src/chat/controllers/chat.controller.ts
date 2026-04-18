import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationDto,
} from '../dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators';
import { QueryMessageDto } from '../dto/query-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @CurrentUser() user,
  ) {
    console.log('User form Token:', user);
    return this.chatService.createConversation(
      createConversationDto,
      user.userId,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  async getUserConversations(@Request() req) {
    return this.chatService.findUserConversations(req.user.userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getConversation(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.chatService.getConversation(id, req.user.userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages from a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?,
  ) {
    const queryDto: QueryMessageDto = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      conversationId: conversationId,
    };

    return this.chatService.getMessages(conversationId, queryDto, user?.userId);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation' })
  async updateConversation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConversationDto: UpdateConversationDto,
    @Request() req,
  ) {
    return this.chatService.updateConversation(
      id,
      updateConversationDto,
      req.user.userId,
    );
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markMessageAsRead(
    @Param('id', ParseIntPipe) messageId: number,
    @Request() req,
  ) {
    await this.chatService.markMessageAsRead(messageId, req.user.userId);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count' })
  async getUnreadMessageCount(@Request() req) {
    const count = await this.chatService.getUnreadCount(req.user.userId);
    return { unreadCount: count };
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    await this.chatService.deleteConversation(id, req.user.userId);
    return { success: true, message: 'Conversation deleted successfully' };
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.chatService.deleteMessage(id, req.user.userId);
    return { success: true, message: 'Message deleted successfully' };
  }
  //chat bot
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message and get AI analysis' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user,
  ) {
    return this.chatService.sendMessage(
      createMessageDto,
      conversationId,
      user.userId,
    );
  }
}
