import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

// Define type-safe interfaces for our JSON objects
export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any; // Allow for additional fields
}

export interface BusinessLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  [key: string]: any; // Allow for additional fields
}

@InputType()
export class CreateBusinessInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  contactInfo: ContactInfo;

  @Field(() => GraphQLJSON)
  @IsObject()
  links: BusinessLinks;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
