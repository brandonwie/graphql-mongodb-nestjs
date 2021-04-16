# NestJS - MongoDB - GraphQL

<a href="https://www.typescriptlang.org/"><img src="https://img.icons8.com/color/48/000000/typescript.png" alt="TypeScript Logo"/></a>
<a href="https://nestjs.com"><img src="https://user-images.githubusercontent.com/13108166/32161516-25ee8a3c-bd56-11e7-9d49-76faed577e1a.png" alt="NestJS Logo" height="48" width="48"/></a>
<a href="https://www.mongodb.com/"><img src="https://img.icons8.com/color/48/000000/mongodb.png" alt="MongoDB Logo"></a>
<a href="https://graphql.org/"><img src="https://img.icons8.com/color/48/000000/graphql.png" alt="GraphQL Logo" /></a>
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

### Lesson Module

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

1. Create service:

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

   ```graphql
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

2.
