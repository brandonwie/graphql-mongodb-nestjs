import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType('student')
export class StudentType {
  @Field((type) => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
