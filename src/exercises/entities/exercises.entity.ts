import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
// import { Submission } from '../../submissions/entities/submission.entity'; // سننشئه لنتائج الأطفال

@Table({ tableName: 'exercises' })
export class Exercise extends Model<Exercise> {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string; 

  @Column({ 
    type: DataType.ENUM('speech', 'handwriting', 'reading'), 
    allowNull: false 
  })
  type: string; 

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string; 

  @Column({ type: DataType.STRING, allowNull: true })
  imageUrl: string; 

  @Column({ type: DataType.STRING, allowNull: true })
  audioUrl: string; 

  @Column({ type: DataType.ENUM('beginner', 'intermediate', 'advanced'), defaultValue: 'beginner' })
  level: string; 
}