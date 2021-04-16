import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateLessonInput {
  @Field()
  name: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;
}
