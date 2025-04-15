import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
class ContactInfoInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  email: string;

  @Field({ nullable: true })
  @IsString()
  phone?: string;
}

@InputType()
class LinksInput {
  @Field({ nullable: true })
  @IsString()
  website?: string;

  @Field({ nullable: true })
  @IsString()
  facebook?: string;

  @Field({ nullable: true })
  @IsString()
  instagram?: string;

  @Field({ nullable: true })
  @IsString()
  twitter?: string;
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

  @Field(() => ContactInfoInput)
  @ValidateNested()
  @Type(() => ContactInfoInput)
  contactInfo: ContactInfoInput;

  @Field(() => LinksInput)
  @ValidateNested()
  @Type(() => LinksInput)
  links: LinksInput;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
} 