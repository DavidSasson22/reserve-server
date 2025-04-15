import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { validationSchema } from './validation.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
})
export class ConfigModule {}
