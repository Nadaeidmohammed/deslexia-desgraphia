import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { User } from '../../users/entities/user.entity';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { MessageType } from '../dto/create-message.dto';
import { QueryConversationDto } from '../dto/query-conversation.dto';
import { QueryMessageDto } from '../dto/query-message.dto';
import { Op } from 'sequelize';

interface CreateMessagePayload {
  conversationId: number;
  senderId: number;
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
}

@Injectable()
export class ChatProvider {
  constructor(
    @InjectModel(Conversation)
    private readonly conversationModel: typeof Conversation,
    @InjectModel(Message)
    private readonly messageModel: typeof Message,
  ) { }

  async createConversation(
    createConversationDto: CreateConversationDto,
    userId: number,
  ): Promise<Conversation> {
    return this.conversationModel.create({
      ...createConversationDto,
      userId,
      lastMessageAt: new Date(),
    });
  }

  async findAllConversations(queryDto: QueryConversationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'lastMessageAt',
      sortOrder = 'DESC',
    } = queryDto;

    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }
    if (status) {
      whereClause.status = status;
    }

    return this.conversationModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id','avatar'],
        },
        {
          model: Message,
          as: 'messages',
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false,
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  async findOneConversation(id: number): Promise<Conversation> {
    return this.conversationModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id','avatar'],
        },
      ],
    });
  }

  async findUserConversations(userId: number): Promise<Conversation[]> {
    return this.conversationModel.findAll({
      where: {
        userId: userId,
      },
      include: [
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false,
        },
      ],
      order: [['lastMessageAt', 'DESC']],
    });
  }

  async updateConversation(
    id: number,
    updateData: Partial<Conversation>,
  ): Promise<[number]> {
    return this.conversationModel.update(updateData, {
      where: { id },
    });
  }

  async deleteConversation(id: number): Promise<number> {
    return this.conversationModel.destroy({ where: { id } });
  }

  // Message methods
  async createMessage(data: any): Promise<Message> {
    const message = await this.messageModel.create(data);
    await this.updateLastMessageTime(data.conversationId);
    return message;
  }

  async findAllMessages(queryDto: QueryMessageDto) {
    const {
      page = 1,
      limit = 50,
      conversationId,
      senderId,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (conversationId) whereClause.conversationId = conversationId;
    if (senderId) whereClause.senderId = senderId;
    if (type) whereClause.type = type;
    if (search) whereClause.content = { [Op.like]: `%${search}%` };

    const orderColumn = sortBy === 'createdAt' ? 'id' : sortBy;

    // Return Sequelize result directly
    return this.messageModel.findAndCountAll({
      where: whereClause,
      distinct: true,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id','avatar'],
        },
        {
          model: Conversation,
          as: 'conversation',
          attributes: ['id', 'title', 'status'],
        },
      ],
      limit,
      offset,
      order: [[orderColumn, sortOrder]],
    });
  }

  async findOneMessage(id: number): Promise<Message> {
    return this.messageModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'avatar'],
        },
        {
          model: Conversation,
          as: 'conversation',
          attributes: ['id', 'title', 'status'],
        },
      ],
    });
  }

  async findConversationMessages(
    conversationId: number,
    limit: number = 50,
  ): Promise<Message[]> {
    return this.messageModel.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id','avatar'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit,
    });
  }

  async updateMessage(
    id: number,
    updateData: Partial<Message>,
  ): Promise<[number, Message[]]> {
    const updateFields: any = { ...updateData };
    // Note: isEdited and editedAt fields are not available in current Message entity
    // if (updateData.content) {
    //   updateFields.isEdited = true;
    //   updateFields.editedAt = new Date();
    // }

    return this.messageModel.update(updateFields, {
      where: { id },
      returning: true,
    });
  }

  async markMessageAsRead(id: number): Promise<void> {
    await this.messageModel.update({ isRead: true }, { where: { id } });
  }

  async markConversationMessagesAsRead(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    await this.messageModel.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          isRead: false,
        },
      },
    );
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return this.messageModel.count({
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { userId: userId },
        },
      ],
      where: {
        senderId: { [Op.ne]: userId },
        isRead: false,
      },
    });
  }

  async countConversations(): Promise<number> {
    return this.conversationModel.count();
  }

  async countMessages(): Promise<number> {
    return this.messageModel.count();
  }

  async findMessageById(id: number): Promise<Message> {
    return this.messageModel.findByPk(id, {
      include: [
        { model: Conversation, as: 'conversation' },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'avatar'],
        },
        {
          model: Conversation,
          as: 'conversation',
          attributes: ['id', 'title', 'status'],
        },
      ],
    });
  }

  async updateMessageReadStatus(
    messageId: number,
    isRead: boolean,
  ): Promise<void> {
    await this.messageModel.update({ isRead }, { where: { id: messageId } });
  }

  async countUnreadMessages(userId: number): Promise<number> {
    return this.messageModel.count({
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { userId: userId },
        },
      ],
      where: {
        senderId: { [Op.ne]: userId },
        isRead: false,
      },
    });
  }

  async deleteMessage(id: number): Promise<number> {
    return this.messageModel.destroy({ where: { id } });
  }

  async updateLastMessageTime(conversationId: number): Promise<void> {
    await this.conversationModel.update(
      { lastMessageAt: new Date() },
      { where: { id: conversationId } },
    );
  }
}
