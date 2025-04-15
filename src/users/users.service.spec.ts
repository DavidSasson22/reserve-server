import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../auth/models/user.model';
import { UpdateUserInput } from './dto/update-user.input';

describe('UsersService', () => {
  let service: UsersService;
  // Mock PrismaService for testing
  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    business: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'First',
          lastName: 'User',
          role: UserRole.USER,
          businesses: [],
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          firstName: 'Second',
          lastName: 'User',
          role: UserRole.USER,
          businesses: [],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        include: {
          businesses: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const mockUser = {
        id: '1',
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'First',
        lastName: 'User',
        role: UserRole.USER,
        businesses: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          businesses: true,
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '999' },
        include: {
          businesses: true,
        },
      });
    });
  });

  describe('update', () => {
    const userId = '1';
    const updateUserInput: UpdateUserInput = {
      id: userId,
      firstName: 'Updated',
      lastName: 'Name',
      reserveServiceDescription: 'Updated reserve service description',
    };

    it('should update a user profile when user updates their own profile', async () => {
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'First',
        lastName: 'User',
        role: UserRole.USER,
        reserveServiceDescription: 'Original description',
      };

      const mockUpdatedUser = {
        ...mockUser,
        firstName: updateUserInput.firstName,
        lastName: updateUserInput.lastName,
        reserveServiceDescription: updateUserInput.reserveServiceDescription,
        businesses: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(
        userId,
        UserRole.USER,
        updateUserInput,
      );

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: updateUserInput.firstName,
          lastName: updateUserInput.lastName,
          reserveServiceDescription: updateUserInput.reserveServiceDescription,
        },
        include: {
          businesses: true,
        },
      });
    });

    it('should update a user profile when admin updates any profile', async () => {
      const adminId = 'admin-id';
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'First',
        lastName: 'User',
        role: UserRole.USER,
        reserveServiceDescription: 'Original description',
      };

      const mockUpdatedUser = {
        ...mockUser,
        firstName: updateUserInput.firstName,
        lastName: updateUserInput.lastName,
        reserveServiceDescription: updateUserInput.reserveServiceDescription,
        businesses: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(
        adminId,
        UserRole.ADMIN,
        updateUserInput,
      );

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: updateUserInput.firstName,
          lastName: updateUserInput.lastName,
          reserveServiceDescription: updateUserInput.reserveServiceDescription,
        },
        include: {
          businesses: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, UserRole.USER, updateUserInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-admin user tries to update another user', async () => {
      const otherUserId = 'other-user-id';
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update(otherUserId, UserRole.USER, updateUserInput),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when email is already in use', async () => {
      const emailUpdateInput: UpdateUserInput = {
        id: userId,
        email: 'existing@example.com',
      };

      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
      };

      const existingUser = {
        id: 'existing-id',
        username: 'existing',
        email: 'existing@example.com',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // For the first call - checking if user exists
        .mockResolvedValueOnce(existingUser); // For the second call - checking if email exists

      await expect(
        service.update(userId, UserRole.USER, emailUpdateInput),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    const userId = '1';

    it('should delete a user and their businesses when user deletes own account', async () => {
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.business.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(userId, UserRole.USER, userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.business.deleteMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBe(true);
    });

    it('should delete a user and their businesses when admin deletes any account', async () => {
      const adminId = 'admin-id';
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.business.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(adminId, UserRole.ADMIN, userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.business.deleteMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(userId, UserRole.USER, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-admin user tries to delete another user', async () => {
      const otherUserId = 'other-user-id';
      const mockUser = {
        id: userId,
        username: 'user1',
        email: 'user1@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.remove(otherUserId, UserRole.USER, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
