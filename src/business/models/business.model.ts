import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/user.model';
import { Tag } from './tag.model';
import { GraphQLJSON } from 'graphql-type-json';
import { ContactInfo, BusinessLinks } from '../dto/create-business.input';

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
  contactInfo: ContactInfo;

  @Field(() => GraphQLJSON)
  links: BusinessLinks;

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
