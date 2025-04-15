import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Business } from './business.model';

export enum TagType {
  LOCATION = 'LOCATION',
  AREA = 'AREA',
  FIELD = 'FIELD',
}

registerEnumType(TagType, {
  name: 'TagType',
  description: 'Type of tag (location, area, or field)',
});

@ObjectType()
export class Tag {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => TagType)
  type: TagType;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [Business], { nullable: true })
  businesses?: Business[];
} 