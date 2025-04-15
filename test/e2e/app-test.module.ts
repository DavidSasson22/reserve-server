import { Module } from '@nestjs/common';
import { ConfigModule } from '../../src/config/config.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppTestModule {}
