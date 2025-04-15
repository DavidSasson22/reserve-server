import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { BusinessModule } from './business/business.module';
import { UsersModule } from './users/users.module';
import { Request } from 'express';
import { User } from './auth/models/user.model';

interface GqlContext {
  req: Request & { user?: User };
}

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    BusinessModule,
    UsersModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }: { req: Request }): GqlContext => ({
        req: req as Request & { user?: User },
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
