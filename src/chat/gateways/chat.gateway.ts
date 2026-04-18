import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { CreateMessageDto } from '../dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  private connectedUsers = new Map<
    string,
    { userId: number; socketId: string }
  >();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract user info from token if available
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (token) {
      try {
        // In a real implementation, you'd verify the JWT token here
        // For now, we'll assume the userId is passed in the handshake
        const userId = client.handshake.auth?.userId;
        if (userId) {
          this.connectedUsers.set(client.id, {
            userId: parseInt(userId),
            socketId: client.id,
          });
          client.join(`user_${userId}`);
        }
      } catch (error) {
        this.logger.error('Error processing connection:', error);
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify user has access to this conversation
      await this.chatService.getConversation(
        data.conversationId,
        userInfo.userId,
      );

      client.join(`conversation_${data.conversationId}`);
      this.logger.log(
        `Client ${client.id} joined conversation ${data.conversationId}`,
      );

      client.emit('joinedConversation', {
        conversationId: data.conversationId,
      });
    } catch (error) {
      this.logger.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation_${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} left conversation ${data.conversationId}`,
    );
    client.emit('leftConversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: number; message: CreateMessageDto },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const message = await this.chatService.sendMessage(
        data.message,
        data.conversationId,
        userInfo.userId,
      );

      // Emit to all clients in the conversation room
      this.server.to(`conversation_${data.conversationId}`).emit('newMessage', {
        conversationId: data.conversationId,
        message,
      });

      // Also emit to the sender
      client.emit('messageSent', { message });

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: number; conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      await this.chatService.markMessageAsRead(data.messageId, userInfo.userId);

      // Emit to all clients in the conversation room
      this.server
        .to(`conversation_${data.conversationId}`)
        .emit('messageRead', {
          messageId: data.messageId,
          userId: userInfo.userId,
        });

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo = this.connectedUsers.get(client.id);
    if (!userInfo) {
      return;
    }

    client.to(`conversation_${data.conversationId}`).emit('userTyping', {
      userId: userInfo.userId,
      isTyping: data.isTyping,
    });
  }

  // Method to send notifications to specific users
  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  // Method to get online users in a conversation
  getOnlineUsersInConversation(conversationId: number): number[] {
    const room = this.server.sockets.adapter.rooms.get(
      `conversation_${conversationId}`,
    );
    if (!room) return [];

    const onlineUsers: number[] = [];
    room.forEach((socketId) => {
      const userInfo = this.connectedUsers.get(socketId);
      if (userInfo) {
        onlineUsers.push(userInfo.userId);
      }
    });

    return [...new Set(onlineUsers)]; // Remove duplicates
  }
}
