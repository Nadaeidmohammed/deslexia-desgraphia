import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Exercise } from '../../exercises/entities/exercises.entity';
import { Child } from 'src/child/entities/child.entity';
@Table({ tableName: 'submissions', timestamps: true })
export class Submission extends Model<Submission> {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @ForeignKey(() => Child)
  @Column({ type: DataType.INTEGER, allowNull: false })
  childId: number;

  @ForeignKey(() => Exercise)
  @Column({ type: DataType.INTEGER, allowNull: false })
  exerciseId: number;

  @Column({ type: DataType.STRING, allowNull: true })
  fileUrl: string; 

  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  score: number; 

  @Column({ type: DataType.TEXT, allowNull: true })
  aiFeedback: string; 

  @Column({ type: DataType.JSON, allowNull: true })
  metadata: any;

  @BelongsTo(() => Child)
  child: Child;

  @BelongsTo(() => Exercise)
  exercise: Exercise;
}