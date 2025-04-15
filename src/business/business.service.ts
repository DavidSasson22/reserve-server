import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { Business } from './models/business.model';
import { UserRole } from '../auth/models/user.model';
import { PaginationInput, BusinessConnection } from './dto/pagination.input';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createBusinessInput: CreateBusinessInput,
  ): Promise<Business> {
    const business = await this.prisma.business.create({
      data: {
        name: createBusinessInput.name,
        description: createBusinessInput.description,
        contactInfo: createBusinessInput.contactInfo,
        links: createBusinessInput.links,
        photos: createBusinessInput.photos || [],
        owner: {
          connect: { id: userId },
        },
      },
      include: {
        owner: true,
        tags: true,
      },
    });

    return business as unknown as Business;
  }

  async findAll(pagination: PaginationInput): Promise<BusinessConnection> {
    const { take = 10, cursor } = pagination;

    // Get businesses with pagination
    const businesses = await this.prisma.business.findMany({
      take: take + 1, // Take one more to determine if there are more results
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
      include: {
        owner: true,
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count
    const totalCount = await this.prisma.business.count();

    // Check if we have a next page
    const hasNextPage = businesses.length > take;

    // Remove the extra item we used to check for next page
    if (hasNextPage) {
      businesses.pop();
    }

    // Get the next cursor
    const nextCursor = hasNextPage
      ? businesses[businesses.length - 1]?.id
      : null;

    return {
      nodes: businesses as unknown as Business[],
      nextCursor,
      totalCount,
    };
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: true,
        tags: true,
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business as unknown as Business;
  }

  async findByOwner(ownerId: string): Promise<Business[]> {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId },
      include: {
        owner: true,
        tags: true,
      },
    });

    return businesses as unknown as Business[];
  }

  async update(
    userId: string,
    userRole: UserRole,
    updateBusinessInput: UpdateBusinessInput,
  ): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id: updateBusinessInput.id },
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID ${updateBusinessInput.id} not found`,
      );
    }

    // Check if user is owner or admin
    if (business.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    const updatedBusiness = await this.prisma.business.update({
      where: { id: updateBusinessInput.id },
      data: {
        ...(updateBusinessInput.name && { name: updateBusinessInput.name }),
        ...(updateBusinessInput.description && {
          description: updateBusinessInput.description,
        }),
        ...(updateBusinessInput.contactInfo && {
          contactInfo: updateBusinessInput.contactInfo,
        }),
        ...(updateBusinessInput.links && {
          links: updateBusinessInput.links,
        }),
        ...(updateBusinessInput.photos && {
          photos: updateBusinessInput.photos,
        }),
      },
      include: {
        owner: true,
        tags: true,
      },
    });

    return updatedBusiness as unknown as Business;
  }

  async remove(
    userId: string,
    userRole: UserRole,
    id: string,
  ): Promise<boolean> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Check if user is owner or admin
    if (business.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this business',
      );
    }

    await this.prisma.business.delete({
      where: { id },
    });

    return true;
  }
}
