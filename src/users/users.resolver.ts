import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../auth/models/user.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserInput } from './dto/update-user.input';

interface GqlContext {
  req: {
    user?: User;
  };
}

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  users() {
    return this.usersService.findAll();
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  userProfile(@Context() context: GqlContext) {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('User not authenticated');
    return this.usersService.findOne(userId);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  user(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  updateUser(
    @Args('input') updateUserInput: UpdateUserInput,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    const userRole = context.req.user?.role as UserRole;
    if (!userId || !userRole) throw new Error('User not authenticated');
    return this.usersService.update(userId, userRole, updateUserInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  deleteUser(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    const userRole = context.req.user?.role as UserRole;
    if (!userId || !userRole) throw new Error('User not authenticated');
    return this.usersService.remove(userId, userRole, id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  deleteMyAccount(@Context() context: GqlContext) {
    const userId = context.req.user?.id;
    const userRole = context.req.user?.role as UserRole;
    if (!userId || !userRole) throw new Error('User not authenticated');
    return this.usersService.remove(userId, userRole, userId);
  }
}
