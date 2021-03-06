# NestJS - MongoDB - GraphQL

<a href="https://www.typescriptlang.org/"><img src="https://img.icons8.com/color/48/000000/typescript.png" alt="TypeScript Logo"/></a>
<a href="https://nestjs.com"><img src="https://user-images.githubusercontent.com/13108166/32161516-25ee8a3c-bd56-11e7-9d49-76faed577e1a.png" alt="NestJS Logo" height="48" width="48"/></a>
<a href="https://www.mongodb.com/"><img src="https://img.icons8.com/color/48/000000/mongodb.png" alt="MongoDB Logo"></a>
<a href="https://graphql.org/"><img src="https://img.icons8.com/color/48/000000/graphql.png" alt="GraphQL Logo" /></a>
<a href="https://typeorm.io/"><img src="https://img.stackshare.io/service/7419/20165699.png" alt="TypeORM Logo" height="48"/></a>
<a href="https://www.docker.com/"><img src="https://img.icons8.com/color/48/000000/docker.png" alt="Docker Logo"/></a>

A simple "School Management App" backend using GraphQL, MongoDB upon NestJS

---

# Development Note

## Project Overview - **School Management**

1. Lesson Resolver (GraphQL) - LessonService (TypeORM)

   - entity: name, startDate, endDate, students

2. Student Resolver (GraphQL) - LessonService (TypeORM)
   - entity: firstName, lastName

## Application Setup

\*Make sure your docker server up and running before `npm start`

- [Docker](https://www.docker.com/): runs MongoDB server

  ```console
  docker run --name mongo -p 27017:27017 -d mongo
  ```

- [Robo 3T](https://robomongo.org/download): an open-source MongoDB management tool.

## Installation process

- Install CLI:

  ```console
  npm install @nestjs/cli
  ```

- Initialize project

  ```console
  nest new APP_NAME
  ```

- Install NPM packages
  - [graphql](https://www.npmjs.com/package/graphql): core GraphQL package that actually drives GraphQL
  - [graphql-tools](https://www.npmjs.com/package/graphql-tools): provides some extra tooling built around GraphQL such as Playground
  - [apollo-server-express](https://www.npmjs.com/package/apollo-server-express): a popular GraphQL server package for NodeJS
  - [@nestjs/graphql](https://www.npmjs.com/package/@nestjs/graphql): official package, integrate into NestJS ecosystem

---

## Setup Modules

### App

1. Connect(import) `GraphQLModule` to AppModule

   ```typescript
   import { Module } from '@nestjs/common';
   import { GraphQLModule } from '@nestjs/graphql';
   import { LessonModule } from './lesson/lesson.module';

   @Module({
     imports: [
       GraphQLModule.forRoot({
         //save schema in memory
         autoSchemaFile: true,
       }),
       LessonModule, // added after creating lesson module
     ],
   })
   export class AppModule {}
   ```

## Lesson Module

1. Create the module:

   ```console
   nest g module lesson
   ```

2. Create `lesson.type.ts` file in lesson folder

   ```typescript
   // lesson.type.ts
   import { ObjectType, Field, ID } from '@nestjs/graphql';
   // this type is GraphQL specific
   @ObjectType('Lesson')
   export class LessonType {
     @Field((type) => ID) // define explicitly
     id: string;

     @Field()
     name: string;

     @Field()
     startDate: string;

     @Field()
     endDate: string;
   }
   ```

3. Create `lesson.resolver.ts`

   ```typescript
   // lesson.resolver.ts
   import { Resolver, Query } from '@nestjs/graphql';
   import { LessonType } from './lesson.type';

   @Resolver((of) => LessonType)
   export class LessonResolver {
     // test query
     @Query((returns) => LessonType)
     lesson() {
       return {
         id: 'someId',
         name: 'Physics Class',
         startDate: new Date().toISOString(),
         endDate: new Date().toISOString(),
       };
     }
   }
   ```

4. Add the resolver to the LessonModule

   ```typescript
   // lesson.module.ts
   import { Module } from '@nestjs/common';
   import { LessonResolver } from './lesson.resolver';

   @Module({
     providers: [LessonResolver], // not controller
   })
   export class LessonModule {}
   ```

5. Start development server

   ```console
   npm run start:dev
   ```

6. Navigate to `localhost:3000/graphql` on your browser and play with the test query!

---

## Persistence: TypeORM and MongoDB

1. Install required dependencies

   ```console
   npm install typeorm @nestjs/typeorm mongodb @types/mongodb
   ```

   - [typeorm](https://www.npmjs.com/package/typeorm): Object-relational mapping library (older than NestJS)
   - [@nestjs/typeorm](https://www.npmjs.com/package/@nestjs/typeorm): TypeORM module for Nest
   - [mongodb](https://www.npmjs.com/package/mongodb): the official MongoDB driver for Node.js
   - [@types/mongodb](https://www.npmjs.com/package/@types/mongodb): type definitions for MongoDB

2. Import TypeORM module with MongoDB

   ```typescript
   // app.module.ts
   import { Module } from '@nestjs/common';
   import { TypeOrmModule } from '@nestjs/typeorm';
   import { GraphQLModule } from '@nestjs/graphql';
   import { LessonModule } from './lesson/lesson.module';

   @Module({
     imports: [
       TypeOrmModule.forRoot({
         type: 'mongodb',
         url: 'mongodb://localhost/school',
         synchronize: true,
         useUnifiedTopology: true,
         entities: [], // now we need to create entities
       }),
       GraphQLModule.forRoot({
         //save schema in memory
         autoSchemaFile: true,
       }),
       LessonModule,
     ],
   })
   export class AppModule {}
   ```

3. Create `lesson.entity.ts` to import in entities

   ```typescript
   // lesson.entity.ts
   import { Entity, PrimaryColumn, Column, ObjectIdColumn } from 'typeorm';

   @Entity()
   export class Lesson {
     // Default mongodb property, generally hide it
     @ObjectIdColumn()
     _id: string;

     @PrimaryColumn()
     id: string;

     @Column()
     name: string;

     @Column()
     startDate: string;

     @Column()
     endDate: string;
   }
   ```

## Service and Resolver

"Service" defines object-relations (ORM).</br>
On the other hand, "Resolver" enables communicating with DB using GraphQL queries

1. Create service: (without test file)

   ```console
   nest g service lesson --no-spec
   ```

2. Won't create separate Lesson Repository as it's focused on GraphQL part
3. Create methods in service

   ```typescript
   // lesson.service.ts
   import { Injectable } from '@nestjs/common';
   import { InjectRepository } from '@nestjs/typeorm';
   import { Lesson } from './lesson.entity';
   import { Repository } from 'typeorm';
   import { v4 as uuid } from 'uuid';

   @Injectable()
   export class LessonService {
     constructor(
       @InjectRepository(Lesson) private lessonRepository: Repository<Lesson>,
     ) {}

     async getLesson(id: string): Promise<Lesson> {
       return this.lessonRepository.findOne({ where: { id } });
     }

     async createLesson(name, startDate, endDate): Promise<Lesson> {
       const lesson = this.lessonRepository.create({
         id: uuid(),
         name,
         startDate,
         endDate,
       });

       return this.lessonRepository.save(lesson);
     }
   }
   ```

4. Create query methods in Resolver using decorators

   ```typescript
   // lesson.resolver.ts
   import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
   import { LessonService } from './lesson.service';
   import { LessonType } from './lesson.type';

   @Resolver((of) => LessonType)
   export class LessonResolver {
     // you can use LessonService's methods in LessonResolver
     constructor(private lessonService: LessonService) {}

     @Query((returns) => LessonType)
     lesson(@Args('id') id: string) {
       return this.lessonService.getLesson(id);
     }

     @Mutation((returns) => LessonType)
     createLesson(
       @Args('name') name: string,
       @Args('startDate') startDate: string,
       @Args('endDate') endDate: string,
     ) {
       return this.lessonService.createLesson(name, startDate, endDate);
     }
   }
   ```

5. Test the Query and Mutation in GraphQL Playground

   ```type
   # returns "id" and "name" of created instance
   mutation {
     createLesson(
       name: "Test Class"
       startDate: "2021-04-16T18:00:00Z"
       endDate: "2021-04-16T18:30:00Z"
     ) {
       id
       name
     }
   }
   # returns "name" and "startDate" of the instance, which matches the id parameter
   query {
     lesson(id: "f72879cf-5a0c-49c9-8ab4-0c4dff0ca8a0") {
       name
       startDate
     }
   }
   ```

---

## Validation (DTO - Data Transfer Object)

1. Install helper NPM packages

   ```console
   npm install class-validator class-transformer
   ```

   - [class-validator](https://www.npmjs.com/package/class-validator): allows use of decorator/non-decorator based validation
   - [class-transformer](https://www.npmjs.com/package/class-transformer): allows transforming plain object to some instance of class and versa

2. Create `lesson.input.ts` as DTO, use `class-validator` package

   ```typescript
   // lesson.input.ts
   import { Field, InputType } from '@nestjs/graphql';
   import { MinLength, IsDateString } from 'class-validator';

   @InputType()
   export class CreateLessonInput {
     @MinLength(1)
     @Field()
     name: string;

     @IsDateString()
     @Field()
     startDate: string;

     @IsDateString()
     @Field()
     endDate: string;
   }
   ```

3. Connect the ValidationPipe to `main.ts`

   ```typescript
   // main.ts
   import { ValidationPipe } from '@nestjs/common';
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';

   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     app.useGlobalPipes(new ValidationPipe()); // here
     await app.listen(3000);
   }
   bootstrap();
   ```

4. Change `createLesson` with newly created DTO `CreateLessonInput`

   ```typescript
   // lesson.service.ts
   async createLesson(createLessonInput: CreateLessonInput): Promise<Lesson> {
    const { name, startDate, endDate } = createLessonInput;

    const lesson = this.lessonRepository.create({
      id: uuid(),
      name,
      startDate,
      endDate,
    });

   ```

5. Refactor Resolver `lesson.resolve.ts`

   ```typescript
   import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
   import { CreateLessonInput } from './lesson.input';
   import { LessonService } from './lesson.service';
   import { LessonType } from './lesson.type';

   @Resolver((of) => LessonType)
   export class LessonResolver {
     constructor(private lessonService: LessonService) {}

     @Query((returns) => LessonType)
     lesson(@Args('id') id: string) {
       return this.lessonService.getLesson(id);
     }
     // Three "Args" refactored as one with lesson DTO
     @Mutation((returns) => LessonType)
     createLesson(
       @Args('createLessonInput') createLessonInput: CreateLessonInput,
     ) {
       return this.lessonService.createLesson(createLessonInput);
     }
   }
   ```

6. Check the schema on `localhost:3000/graphql`.

   ```typescript
   type Lesson {
     id: ID!
     name: String!
     startDate: String!
     endDate: String!
   }

   type Query {
     lesson(id: String!): Lesson!
   }

   type Mutation {
     createLesson(createLessonInput: CreateLessonInput!): Lesson!
   }

   input CreateLessonInput {
     name: String!
     startDate: String!
     endDate: String!
   }
   ```

7. Try the Mutation example:

   ```typescript
   mutation {
      createLesson(
        createLessonInput: {
          name: "Test Class"
          startDate: "2021-04-16T18:00:00Z"
          endDate: "2021-04-16T18:30:00Z"
        }
      ) {
        name
        id
      }
   }
   ```

---

## Get All Lessons GraphQL Query

1. create `getLessions()` method

   ```typescript
    // lesson.service.ts
    async getLessons(): Promise<Lesson[]> {
    return this.lessonRepository.find();
   }
   ```

2. create `lessons` query

   ```typescript
   // lesson.resolver.ts
   // [LessonType] === LessonType[] in GraphQL
   @Query((returns) => [LessonType])
   lessons() {
   return this.lessonService.getLessons();
   }
   ```

3. Check out `localhost:3000/graphql` for the query created

---

## Student Module

1. Create Student Module / Service

   ```console
   nest g module student
   nest g service student
   ```

2. Create `student.entity.ts` and define Student entity

   ```typescript
   // student.entity.ts
   import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';

   @Entity()
   export class Student {
     @ObjectIdColumn()
     _id: string;

     @PrimaryColumn()
     id: string;

     @Column()
     firstName: string;

     @Column()
     lastName: string;
   }
   ```

3. Connect the entity into Student Module

   ```typescript
   import { Module } from '@nestjs/common';
   import { TypeOrmModule } from '@nestjs/typeorm';
   import { Student } from './student.entity';
   import { StudentService } from './student.service';

   @Module({
     imports: [TypeOrmModule.forFeature([Student])],
     providers: [StudentService],
   })
   export class StudentModule {}
   ```

4. Connect the entity into App Module

   ```typescript
   @Module({
     imports: [
       TypeOrmModule.forRoot({
         type: 'mongodb',
         url: 'mongodb://localhost/school',
         synchronize: true,
         useUnifiedTopology: true,
         entities: [Lesson, Student],
       }),
       GraphQLModule.forRoot({
         //save schema in memory
         autoSchemaFile: true,
       }),
       LessonModule,
       StudentModule,
     ],
   })
   export class AppModule {}
   ```

5. Other Student files

   ```typescript
   // student.service.ts
   import { Injectable } from '@nestjs/common';
   import { InjectRepository } from '@nestjs/typeorm';
   import { Repository } from 'typeorm';
   import { CreateStudentInput } from './student.input';
   import { Student } from './student.entity';
   import { v4 as uuid } from 'uuid';

   @Injectable()
   export class StudentService {
     constructor(
       @InjectRepository(Student)
       private studentRepository: Repository<Student>,
     ) {}

     async getStudent(id: string): Promise<Student> {
       return this.studentRepository.findOne({ where: id });
     }

     async getStudents(): Promise<Student[]> {
       return this.studentRepository.find();
     }

     async createStudent(
       createStudentInput: CreateStudentInput,
     ): Promise<Student> {
       const { firstName, lastName } = createStudentInput;
       const student = this.studentRepository.create({
         id: uuid(),
         firstName,
         lastName,
       });

       return this.studentRepository.save(student);
     }
   }
   ```

   ```typescript
   // student.resolver.ts
   import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
   import { Student } from './student.entity';
   import { StudentService } from './student.service';
   import { StudentType } from './student.type';
   import { CreateStudentInput } from './student.input';

   // init Resolver
   @Resolver((of) => StudentType)
   export class StudentResolver {
     // inject Student Service
     constructor(private studentService: StudentService) {}

     @Query((returns) => StudentType)
     student(@Args('id') id: string): Promise<Student> {
       return this.studentService.getStudent(id);
     }

     @Query((returns) => [StudentType])
     students(): Promise<Student[]> {
       return this.studentService.getStudents();
     }

     @Mutation((returns) => StudentType)
     createStudent(
       @Args('createStudentInput') createStudentInput: CreateStudentInput,
     ): Promise<Student> {
       return this.studentService.createStudent(createStudentInput);
     }
   }
   ```

   ```typescript
   //student.input.ts (DTO)
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
   ```

---

## Assign Students to Lesson (GraphQL Mutation)

1. Add a new column "students' id array" to Lesson entity

   ```typescript
   // lesson.entity.ts
   import { Entity, PrimaryColumn, Column, ObjectIdColumn } from 'typeorm';

   @Entity()
   export class Lesson {
     @ObjectIdColumn()
     _id: string;

     @PrimaryColumn()
     id: string;

     @Column()
     name: string;

     @Column()
     startDate: string;

     @Column()
     endDate: string;

     @Column() // HERE!
     students: string[];
   }
   ```

2. Modify StudentType as well

   ```typescript
   // lesson.type.ts
   import { ObjectType, Field, ID } from '@nestjs/graphql';
   import { StudentType } from '../student/student.type';

   @ObjectType('Lesson')
   export class LessonType {
     @Field((type) => ID)
     id: string;

     @Field()
     name: string;

     @Field()
     startDate: string;

     @Field()
     endDate: string;
     // HERE!
     @Field((type) => [StudentType])
     students: string[];
   }
   ```

3. Create DTO

   ```typescript
   import { InputType, Field, ID } from '@nestjs/graphql';
   import { IsUUID } from 'class-validator';

   @InputType()
   export class AssignStudentsToLessonInput {
     @IsUUID()
     @Field((type) => ID)
     lessonId: string;

     @IsUUID('4', { each: true })
     @Field((type) => [ID])
     studentIds: string[];
   }
   ```

4. Add `assignStudentsToLesson` in Service

   ```typescript
   // lesson.service.ts
   async assignStudentsToLesson(
    lessonId: string,
    studentIds: string[],
   ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    lesson.students = [...lesson.students, ...studentIds];
    return this.lessonRepository.save(lesson);
   }
   ```

   ```typescript
   // lesson.service.ts
   // In createLesson method
   const lesson = this.lessonRepository.create({
     id: uuid(),
     name,
     startDate,
     endDate,
     students: [], // Add this line
   });
   ```

   Creating repository in this way is not recommended and it is used for the sake of tutorial

5. Add `assignStudentsToLesson` in Resolver

   ```typescript
   // lesson.resolver.ts
     @Mutation((returns) => LessonType)
   assignStudentsToLesson(
     @Args('assignStudentsToLessonInput')
     assignStudentsToLessonInput: AssignStudentsToLessonInput,
   ) {
     const { lessonId, studentIds } = assignStudentsToLessonInput;
     return this.lessonService.assignStudentsToLesson(lessonId, studentIds);
   }
   ```

## Improvement: Assign Students upon Lesson creation

1. Update DTO `lesson.input.ts`

   ```typescript
   import { Field, ID, InputType } from '@nestjs/graphql';
   import { MinLength, IsDateString, IsUUID } from 'class-validator';

   @InputType()
   export class CreateLessonInput {
     @MinLength(1)
     @Field()
     name: string;

     @IsDateString()
     @Field()
     startDate: string;

     @IsDateString()
     @Field()
     endDate: string;

     @IsUUID('4', { each: true })
     @Field((type) => [ID], { defaultValue: [] })
     students: string[];
   }
   ```

2. Update `createLesson` in `lesson.service.ts`

```typescript
async createLesson(createLessonInput: CreateLessonInput): Promise<Lesson> {
 const { name, startDate, endDate, students } = createLessonInput;

 const lesson = this.lessonRepository.create({
   id: uuid(),
   name,
   startDate,
   endDate,
   students,
 });

 return this.lessonRepository.save(lesson);
}
```

---

## Resolve "students" Field in Lesson

At this point, Lesson does not support Student schema. So we are going to connect those two schemas.

1. Test what object returns when using `@ResolveField()` decorator

   ```typescript
   // lesson.resolver.ts
   @ResolveField()
   async students(@Parent() lesson: Lesson) {
    console.log(lesson);
   }
   ```

   ```graphql
   # GraphQL Query
   mutation {
     createLesson(
       createLessonInput: {
         name: "Test lesson with students1"
         startDate: "2021-04-16T18:00:00Z"
         endDate: "2021-04-16T18:30:00Z"
         students: [
           "9a4445bc-4c54-4a20-b2e8-fece6f0d9714"
           "f72879cf-5a0c-49c9-8ab4-0c4dff0ca8a0"
           "7a6ca555-8506-4bae-95dd-1f460d59c13c"
         ]
       }
     ) {
       id
       name
       startDate
       endDate
       students
     }
   }
   ```

   Execute the query.

   Here is the result on your console.

   ```console
   Lesson {
   id: '5f456642-23e5-4e69-8f47-907954e011f5',
   name: 'Test lesson with students1',
   startDate: '2021-04-16T18:00:00Z',
   endDate: '2021-04-16T18:30:00Z',
   students: [
    '9a4445bc-4c54-4a20-b2e8-fece6f0d9714',
    'f72879cf-5a0c-49c9-8ab4-0c4dff0ca8a0',
    '7a6ca555-8506-4bae-95dd-1f460d59c13c'
   ],
   _id: 607a52c703effaed86281cd4
   }
   ```

2. Create `getManyStudents` method in `student.service.ts`

   ```typescript
   // student.service.ts
   async getManyStudents(studentIds: string[]):Promise<Student[]> {
    return this.studentRepository.find({
      where: {
        id: {
          $in: studentIds,
        },
      },
    });
   }

   ```

3. Export class **StudentService** so that **LessonModule** can use it

   ```typescript
   // student.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([Student])],
     providers: [StudentResolver, StudentService],
     exports: [StudentService], // Here
   })
   export class StudentModule {}
   ```

4. Import **StudentModule** in **LessonModule**

   ```typescript
   // lesson.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([Lesson]), StudentModule], // Here
     providers: [LessonResolver, LessonService],
   })
   export class LessonModule {}
   ```

5. Inject **StudentService** in **LessonResolver**'s constructor and it's ready to use

   ```typescript
   // lesson.resolver.ts
    @Resolver((of) => LessonType)
   export class LessonResolver {
   constructor(
    private lessonService: LessonService,
    private studentService: StudentService,
   ) {}
   ...
   }
   ```

6. Implement

   ```typescript
   // lesson.resolver.ts
   @ResolveField()
   async students(@Parent() lesson: Lesson) {
    return this.studentService.getManyStudents(lesson.students);
   }
   ```

7. When `students` ids are passed through `createLesson` as parameter, now GraphQL successfully returns **StudentType** as result

   Create dummy students for the test

   ```graphql
   mutation {
     createLesson(
       createLessonInput: {
         name: "Test Class"
         startDate: "2021-04-16T18:00:00Z"
         endDate: "2021-04-16T18:30:00Z"
         students: [
           "4f92c224-1f18-4f46-9eb0-5fc8c2af1b71"
           "dbdfb79d-b0f7-4b2e-8af1-bacedc287e34"
           "82dca82c-2636-4f4e-b7a5-cee0970e1319"
         ]
       }
     ) {
       id
       name
       startDate
       endDate
       students {
         firstName
         lastName
       }
     }
   }
   ```

   Here is the result

   ```json
   {
     "data": {
       "createLesson": {
         "id": "00205f41-8597-42c3-94a4-d407c274261f",
         "name": "Test Class",
         "startDate": "2021-04-16T18:00:00Z",
         "endDate": "2021-04-16T18:30:00Z",
         "students": [
           {
             "firstName": "Marianna",
             "lastName": "Wie"
           },
           {
             "firstName": "Brandon",
             "lastName": "Wie"
           },
           {
             "firstName": "John",
             "lastName": "Doe"
           }
         ]
       }
     }
   }
   ```
