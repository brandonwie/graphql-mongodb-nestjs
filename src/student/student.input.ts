import { Field, InputType } from '@nestjs/graphql';
import { Length } from 'class-validator';

@InputType()
export class CreateStudentInput {
  @Length(1, 225)
  @Field()
  firstName: string;

  @Length(1, 225)
  @Field()
  lastName: string;
}
