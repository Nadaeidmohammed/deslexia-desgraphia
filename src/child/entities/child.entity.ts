import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'children', timestamps: true })
export class Child extends Model<Child> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.DATE, allowNull: false })
  birthDate: Date;

  @Column({ type: DataType.INTEGER, allowNull: false })
  gender: number;

  @Column({ type: DataType.STRING, allowNull: true })
  avatar: string;

  @Column({ type: DataType.STRING, allowNull: false })
  level: string;

  // الربط مع اليوزر
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, onDelete: 'CASCADE' })
  parentId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  parent: User;
}
