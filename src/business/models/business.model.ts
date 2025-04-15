import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/user.model';
import { Tag } from './tag.model';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class Business {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  ownerId: string;

  @Field(() => GraphQLJSON)
  contactInfo: Record<string, any>;

  @Field(() => GraphQLJSON)
  links: Record<string, any>;

  @Field(() => [String])
  photos: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  owner?: User;

  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];
} 