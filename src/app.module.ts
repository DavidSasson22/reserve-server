import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { BusinessModule } from './business/business.module';
import { Request } from 'express';

interface GqlContext {
  req: Request & {
    user?: {
      id: string;
      username: string;
      role: string;
    };
  };
}

@Module({
  imports: [
    ConfigModule, 
    PrismaModule, 
    AuthModule,
    BusinessModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }): GqlContext => ({ req }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
