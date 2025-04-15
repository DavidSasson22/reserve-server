import { Module } from '@nestjs/common';
import { BusinessResolver } from './business.resolver';
import { BusinessService } from './business.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BusinessResolver, BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
