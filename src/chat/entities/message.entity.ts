import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Conversation } from './conversation.entity';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'messages',
  timestamps: true,
})
export class Message extends Model<Message> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Conversation)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  conversationId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  senderId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @Column({
    type: DataType.ENUM('text', 'image', 'file', 'system'),
    defaultValue: 'text',
  })
  type: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: any; 
  
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRead: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  readAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Conversation)
  conversation: Conversation;

  @BelongsTo(() => User, 'senderId')
  sender: User;
}
