import { Field, InputType } from '@nestjs/graphql';
import { Length } from 'class-validator';

@InputType()
export class CreateStudentInput {
  @Field()
  @Length(1, 225)
  firstName: string;

  @Field()
  @Length(1, 225)
  lastName: string;
}
