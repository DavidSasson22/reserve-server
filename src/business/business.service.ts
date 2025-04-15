import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { Business } from './models/business.model';
import { UserRole } from '../auth/models/user.model';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createBusinessInput: CreateBusinessInput): Promise<Business> {
    return this.prisma.business.create({
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
    });
  }

  async findAll(): Promise<Business[]> {
    return this.prisma.business.findMany({
      include: {
        owner: true,
        tags: true,
      },
    });
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

    return business;
  }

  async findByOwner(ownerId: string): Promise<Business[]> {
    return this.prisma.business.findMany({
      where: { ownerId },
      include: {
        owner: true,
        tags: true,
      },
    });
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
      throw new NotFoundException(`Business with ID ${updateBusinessInput.id} not found`);
    }

    // Check if user is owner or admin
    if (business.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this business');
    }

    return this.prisma.business.update({
      where: { id: updateBusinessInput.id },
      data: {
        ...(updateBusinessInput.name && { name: updateBusinessInput.name }),
        ...(updateBusinessInput.description && { description: updateBusinessInput.description }),
        ...(updateBusinessInput.contactInfo && { contactInfo: updateBusinessInput.contactInfo }),
        ...(updateBusinessInput.links && { links: updateBusinessInput.links }),
        ...(updateBusinessInput.photos && { photos: updateBusinessInput.photos }),
      },
      include: {
        owner: true,
        tags: true,
      },
    });
  }

  async remove(userId: string, userRole: UserRole, id: string): Promise<boolean> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Check if user is owner or admin
    if (business.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this business');
    }

    await this.prisma.business.delete({
      where: { id },
    });

    return true;
  }
} 