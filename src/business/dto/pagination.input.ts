import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsPositive, IsString } from 'class-validator';
import { Business } from '../models/business.model';

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsPositive()
  @IsOptional()
  take?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  cursor?: string;
}

@ObjectType()
export class BusinessConnection {
  @Field(() => [Business])
  nodes: Business[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field(() => Int)
  totalCount: number;
}
