# GraphQL - MongoDB - NestJS

A simple "school management" backend using GraphQL, MongoDB based on NestJS

# Development Note

## Project Overview

> **School Management**

1. Lesson Resolver (GraphQL) - LessonService (NestJS)

   - entity: name, startDate, endDate, students

2. Student Resolver (GraphQL) - LessonService (NestJS)
   - entity: firstName, lastName

## Application Setup

\*Make sure your docker server up and running before `npm start`

- [Docker](https://www.docker.com/): runs MongoDB server
  - `$ docker run --name mongo -p 27017:27017 -d mongo`
- [Robo 3T](https://robomongo.org/download): an open-source MongoDB management tool.

## Installation process

- Install CLI: `npm install @nestjs/cli`
- Initialize project: `nest new APP_NAME`
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

### Lesson

1. create the module: `nest g module lesson`
2. create `lesson.type.ts` file in lesson folder

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

3. create `lesson.resolver.ts`

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

4. add the resolver to the LessonModule

   ```typescript
   // lesson.module.ts
   import { Module } from '@nestjs/common';
   import { LessonResolver } from './lesson.resolver';

   @Module({
     providers: [LessonResolver], // not controller
   })
   export class LessonModule {}
   ```

5. Start development server: `$ npm run start:dev`

6. Navigate to `localhost:3000/graphql` on your browser and play a bit!

---

## Persistence: TypeORM and MongoDB

1. Install required dependencies: `$ npm install typeorm @nestjs/typeorm mongodb @types/mongodb`

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

1. Create service: `$ nest g service lesson --no-spec`
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

## Validation

---

<!-- Given NestJS README content -->
<p align="center">
<a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
 <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
<a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
 <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
<a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
<!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
[![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
