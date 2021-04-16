import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudentInput } from './create-student.input';
import { Student } from './student.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student) private studentRepository: Repository<Student>,
  ) {}

  async student(id: string) {
    return this.studentRepository.findOne({ where: id });
  }

  async students() {
    return this.studentRepository.find();
  }

  async createStudent(createStudentInput: CreateStudentInput) {
    const { firstName, lastName } = createStudentInput;
    return this.studentRepository.create({
      id: uuid(),
      firstName,
      lastName,
    });
  }
}
