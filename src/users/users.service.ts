import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User, UserRole } from '../auth/models/user.model';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      include: {
        businesses: true,
      },
    });
    return users as unknown as User[];
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        businesses: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as unknown as User;
  }

  async update(
    currentUserId: string,
    currentUserRole: UserRole,
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    // Make sure the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: updateUserInput.id },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${updateUserInput.id} not found`,
      );
    }

    // Only allow users to update their own profile, or admins to update any profile
    if (
      currentUserId !== updateUserInput.id &&
      currentUserRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this user',
      );
    }

    // Handle email updates - check for uniqueness
    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserInput.email },
      });

      if (existingUser) {
        throw new ForbiddenException('Email is already in use');
      }
    }

    // Update the user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: updateUserInput.id },
      data: {
        ...(updateUserInput.firstName && {
          firstName: updateUserInput.firstName,
        }),
        ...(updateUserInput.lastName && { lastName: updateUserInput.lastName }),
        ...(updateUserInput.email && { email: updateUserInput.email }),
        ...(updateUserInput.phone && { phone: updateUserInput.phone }),
        ...(updateUserInput.reserveServiceDescription && {
          reserveServiceDescription: updateUserInput.reserveServiceDescription,
        }),
      },
      include: {
        businesses: true,
      },
    });

    return updatedUser as unknown as User;
  }

  async remove(
    currentUserId: string,
    currentUserRole: UserRole,
    userId: string,
  ): Promise<boolean> {
    // Make sure the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Only allow users to delete their own account, or admins to delete any account
    if (currentUserId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this user',
      );
    }

    // We need to first delete all businesses owned by this user
    // Since we're using Prisma, we can use cascading deletes by modifying the schema
    // But for safety, let's do it explicitly here
    await this.prisma.business.deleteMany({
      where: { ownerId: userId },
    });

    // Now delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return true;
  }
}
