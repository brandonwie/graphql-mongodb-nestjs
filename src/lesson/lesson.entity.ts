import { Entity, PrimaryColumn, Column, ObjectIdColumn } from 'typeorm';

@Entity()
export class Lesson {
  // MongoDB has "_id" property, generally hide it
  @ObjectIdColumn()
  _id: string;

  @PrimaryColumn() // public id
  id: string;

  @Column()
  name: string;

  @Column()
  startDate: string;

  @Column()
  endDate: string;
}
