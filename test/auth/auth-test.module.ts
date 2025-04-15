import { Module } from '@nestjs/common';
import { ConfigModule } from '../../src/config/config.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { AuthModule } from '../../src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
  ],
})
export class AuthTestModule {} 
