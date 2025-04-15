import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateBusinessInput } from './create-business.input';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateBusinessInput extends PartialType(CreateBusinessInput) {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
