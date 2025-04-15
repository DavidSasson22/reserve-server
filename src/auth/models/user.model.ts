import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Business } from '../../business/models/business.model';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role of the user (USER or ADMIN)',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  reserveServiceDescription: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [Business], { nullable: true })
  businesses?: Business[];
} 