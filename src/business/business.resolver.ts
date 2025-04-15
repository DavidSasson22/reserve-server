import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { BusinessService } from './business.service';
import { Business } from './models/business.model';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/models/user.model';
import { GqlContext } from './interfaces/graphql-context.interface';
import { BusinessConnection, PaginationInput } from './dto/pagination.input';

@Resolver(() => Business)
export class BusinessResolver {
  constructor(private readonly businessService: BusinessService) {}

  @Mutation(() => Business)
  @UseGuards(GqlAuthGuard)
  createBusiness(
    @Args('input') createBusinessInput: CreateBusinessInput,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('User not authenticated');
    return this.businessService.create(userId, createBusinessInput);
  }

  @Query(() => BusinessConnection, { name: 'businesses' })
  findAll(
    @Args('pagination', { nullable: true }) pagination: PaginationInput = {},
  ) {
    return this.businessService.findAll(pagination);
  }

  @Query(() => Business, { name: 'business' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.businessService.findOne(id);
  }

  @Query(() => [Business], { name: 'myBusinesses' })
  @UseGuards(GqlAuthGuard)
  findMyBusinesses(@Context() context: GqlContext) {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('User not authenticated');
    return this.businessService.findByOwner(userId);
  }

  @Mutation(() => Business)
  @UseGuards(GqlAuthGuard)
  updateBusiness(
    @Args('input') updateBusinessInput: UpdateBusinessInput,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    const userRole = context.req.user?.role as UserRole;
    if (!userId || !userRole) throw new Error('User not authenticated');
    return this.businessService.update(userId, userRole, updateBusinessInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    const userRole = context.req.user?.role as UserRole;
    if (!userId || !userRole) throw new Error('User not authenticated');
    return this.businessService.remove(userId, userRole, id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminRemoveBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GqlContext,
  ) {
    const userId = context.req.user?.id;
    if (!userId) throw new Error('User not authenticated');
    const userRole = UserRole.ADMIN;
    return this.businessService.remove(userId, userRole, id);
  }
}
