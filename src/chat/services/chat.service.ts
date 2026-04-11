import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ChatProvider } from '../providers/chat.provider';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationDto,
  QueryConversationDto,
} from '../dto';
import { MessageType } from '../dto/create-message.dto';
import { PaginationResult } from '../../common/interfaces/pagination';
import { QueryMessageDto } from '../dto/query-message.dto';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private groq: Groq;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatProvider: ChatProvider,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      this.logger.error('GROQ_API_KEY is missing in .env file!');
      throw new Error('GROQ_API_KEY is missing or empty');
    }

    this.groq = new Groq({ apiKey });
  }
  async createConversation(
    createConversationDto: CreateConversationDto,
    userId: number,
  ): Promise<Conversation> {
    return this.chatProvider.createConversation(createConversationDto, userId);
  }

  async findUserConversations(userId: number): Promise<Conversation[]> {
    return this.chatProvider.findUserConversations(userId);
  }

  async findAllConversations(
    queryDto: QueryConversationDto,
  ): Promise<PaginationResult<Conversation>> {
    const { rows, count } =
      await this.chatProvider.findAllConversations(queryDto);
    const { page, limit } = queryDto;

    return {
      data: rows,
      meta: {
        total: count,
        page: Number(page || 1),
        limit: Number(limit || 10),
        totalPages: Math.ceil(count / (limit || 10)),
      },
    };
  }

  async getConversation(id: number, userId?: number): Promise<Conversation> {
    const conversation = await this.chatProvider.findOneConversation(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user has access to this conversation
    if (userId && conversation.userId !== userId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    return conversation;
  }

  async updateConversation(
    id: number,
    updateConversationDto: UpdateConversationDto,
    userId: number,
  ): Promise<Conversation> {
    // Ensure user has access before updating
    await this.getConversation(id, userId);

    await this.chatProvider.updateConversation(id, updateConversationDto);
    return this.getConversation(id);
  }

  // async deleteConversation(id: number): Promise<void> {
  //   await this.chatProvider.deleteConversation(id);
  // }

  async countConversations(): Promise<number> {
    return this.chatProvider.countConversations();
  }

  async sendMessage(
    createMessageDto: CreateMessageDto,
    conversationId: number,
    senderId: number,
  ): Promise<Message> {
    const conversation = await this.getConversation(conversationId, senderId);

    if (conversation.status === 'archived') {
      throw new ForbiddenException('Cannot send message to archived conversation');
    }

    const userMessage = await this.chatProvider.createMessage({
      conversationId,
      senderId,
      content: createMessageDto.content,
      type: 'text',
    });

    // 2. جلب تاريخ المحادثة (عشان الـ AI يعرف السياق - Restore Context)
    const history = await this.chatProvider.findConversationMessages(conversationId, 10);
    const formattedHistory = history.map(msg => ({
      role: msg.senderId === senderId ? 'user' : 'assistant',
      content: msg.content,
    }));

    // 3. استدعاء الـ AI (Groq) للتحليل والرد
    const aiAnalysis = await this.getAiResponse(createMessageDto.content, formattedHistory);

    // 4. حفظ رد الـ AI في قاعدة البيانات
    // ملاحظة: الـ metadata ستحتوي على الـ feedback (detected_words, suspected_letter, etc.)
    const botMessage = await this.chatProvider.createMessage({
      conversationId,
      senderId: 0, // أو ID مخصص للبوت
      content: aiAnalysis.reply,
      type: 'text',
      metadata: aiAnalysis.feedback, // هنا نخزن التحليل (الديسليكسيا)
    });

    return botMessage;
  }

  // دالة مساعدة للتعامل مع Groq (نفس منطق كود البايثون)
  private async getAiResponse(userContent: string, history: any[]) {
    const systemPrompt = `
    You are an AI assistant that helps parents support their children with learning difficulties such as dyslexia and dysgraphia.
    You must ALWAYS respond with VALID JSON ONLY.

    Response format:
    {
     "reply": "A natural Arabic message to the parent",
     "feedback": {
       "detected_words": [],
       "suspected_letter": "",
       "issue_type": "dyslexia or dysgraphia or none"
        }
    }

    Rules:
    - The "reply" MUST be in Arabic language only.
    - The "reply" must be a normal, friendly Arabic response to the parent.
    - Extract words mentioned by the parent that show difficulty.
    - Detect the most repeated letter causing trouble.
    - Return ONLY JSON. Do not write any conversational text outside the JSON block.
  `;

    const completion = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userContent },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async getMessages(
    conversationId: number,
    query: QueryMessageDto,
    userId?: number,
  ): Promise<PaginationResult<Message>> {

    if (userId) {
      await this.getConversation(conversationId, userId);
    }

    query.conversationId = conversationId;

    const { rows, count } = await this.chatProvider.findAllMessages(query);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;

    return {
      data: rows,
      meta: {
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    const message = await this.chatProvider.findMessageById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only allow marking messages as read if user is part of the conversation
    // if (message.conversation.userId !== userId) {
    //   throw new ForbiddenException('Access denied');
    // }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return;
    }

    await this.chatProvider.updateMessageReadStatus(messageId, true);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.chatProvider.countUnreadMessages(userId);
  }

  // Additional methods that delegate to ChatProvider
  // async findAllConversations(queryDto: any): Promise<any> {
  //   return this.chatProvider.findAllConversations(queryDto);
  // }

  async deleteConversation(id: number, userId: number): Promise<void> {
    const conversation = await this.chatProvider.findOneConversation(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this conversation');
    }

    await this.chatProvider.deleteConversation(id);
  }

  async findAllMessages(queryDto: any = {}): Promise<any> {
    return this.chatProvider.findAllMessages(queryDto);
  }

  async deleteMessage(id: number, userId: number): Promise<void> {
    const message = await this.chatProvider.findMessageById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.chatProvider.deleteMessage(id);
  }

  async getMessageStats(): Promise<number> {
    return this.chatProvider.countMessages();
  }
}
