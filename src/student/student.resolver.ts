import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Student } from './student.entity';
import { StudentService } from './student.service';
import { StudentType } from './student.type';
import { CreateStudentInput } from './create-student.input';

// init Resolver
@Resolver((of) => StudentType)
export class StudentResolver {
  // inject Student Service
  constructor(private studentService: StudentService) {}

  @Query((returns) => Student)
  student(@Args('id') id: string) {
    return this.studentService.student(id);
  }

  @Query((returns) => [Student])
  students() {
    return this.studentService.students();
  }

  @Mutation((returns) => StudentType)
  createStudent(
    @Args('createStudentInput') createStudentInput: CreateStudentInput,
  ) {
    return this.studentService.createStudent(createStudentInput);
  }
}
