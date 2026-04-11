import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { Conversation } from '../../chat/entities/conversation.entity';
import { Message } from 'src/chat/entities/message.entity';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatar: string;

  @Column({
    type: DataType.ENUM('user', 'admin', 'parent'),
    defaultValue: 'parent',
  })
  role: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  resetPasswordOtp: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resetPasswordExpires: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Conversation)
  conversations: Conversation[];

  @HasMany(() => Message)
  messages: Message[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isEmailVerified: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  otpAttempts: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  verificationCode: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  verificationExpires: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deletedAt: Date;
}
