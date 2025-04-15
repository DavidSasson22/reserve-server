import { Test, TestingModule } from '@nestjs/testing';
import { BusinessService } from './business.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { UserRole } from '../auth/models/user.model';

describe('BusinessService', () => {
  let service: BusinessService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;

  const mockPrismaService = {
    business: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-id';
    const createBusinessInput: CreateBusinessInput = {
      name: 'Test Business',
      description: 'A test business description',
      contactInfo: { phone: '123-456-7890', email: 'test@example.com' },
      links: { website: 'https://example.com' },
      photos: ['photo1.jpg', 'photo2.jpg'],
    };

    it('should create a new business', async () => {
      const mockBusiness = {
        id: 'business-id',
        name: createBusinessInput.name,
        description: createBusinessInput.description,
        contactInfo: createBusinessInput.contactInfo,
        links: createBusinessInput.links,
        photos: createBusinessInput.photos,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: userId },
        tags: [],
      };

      mockPrismaService.business.create.mockResolvedValue(mockBusiness);

      const result = await service.create(userId, createBusinessInput);

      expect(mockPrismaService.business.create).toHaveBeenCalledWith({
        data: {
          name: createBusinessInput.name,
          description: createBusinessInput.description,
          contactInfo: createBusinessInput.contactInfo,
          links: createBusinessInput.links,
          photos: createBusinessInput.photos,
          owner: {
            connect: { id: userId },
          },
        },
        include: {
          owner: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockBusiness);
    });

    it('should handle empty photos array', async () => {
      const createInputWithoutPhotos = {
        ...createBusinessInput,
        photos: undefined,
      };

      const mockBusiness = {
        id: 'business-id',
        name: createInputWithoutPhotos.name,
        description: createInputWithoutPhotos.description,
        contactInfo: createInputWithoutPhotos.contactInfo,
        links: createInputWithoutPhotos.links,
        photos: [],
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: userId },
        tags: [],
      };

      mockPrismaService.business.create.mockResolvedValue(mockBusiness);

      await service.create(userId, createInputWithoutPhotos);

      expect(mockPrismaService.business.create).toHaveBeenCalledWith({
        data: {
          name: createInputWithoutPhotos.name,
          description: createInputWithoutPhotos.description,
          contactInfo: createInputWithoutPhotos.contactInfo,
          links: createInputWithoutPhotos.links,
          photos: [],
          owner: {
            connect: { id: userId },
          },
        },
        include: {
          owner: true,
          tags: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated businesses', async () => {
      const mockBusinesses = [
        {
          id: 'business-id-1',
          name: 'Business 1',
          description: 'Description 1',
          ownerId: 'user-id-1',
          owner: { id: 'user-id-1' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'business-id-2',
          name: 'Business 2',
          description: 'Description 2',
          ownerId: 'user-id-2',
          owner: { id: 'user-id-2' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.business.findMany.mockResolvedValue(mockBusinesses);
      mockPrismaService.business.count.mockResolvedValue(2);

      const result = await service.findAll({ take: 10 });

      expect(mockPrismaService.business.findMany).toHaveBeenCalledWith({
        take: 11,
        include: {
          owner: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual({
        nodes: mockBusinesses,
        nextCursor: null,
        totalCount: 2,
      });
    });

    it('should handle pagination with cursor', async () => {
      const mockBusinesses = [
        {
          id: 'business-id-2',
          name: 'Business 2',
          description: 'Description 2',
          ownerId: 'user-id-2',
          owner: { id: 'user-id-2' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'business-id-3',
          name: 'Business 3',
          description: 'Description 3',
          ownerId: 'user-id-3',
          owner: { id: 'user-id-3' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.business.findMany.mockResolvedValue(mockBusinesses);
      mockPrismaService.business.count.mockResolvedValue(3);

      const result = await service.findAll({
        take: 2,
        cursor: 'business-id-1',
      });

      expect(mockPrismaService.business.findMany).toHaveBeenCalledWith({
        take: 3,
        cursor: {
          id: 'business-id-1',
        },
        skip: 1,
        include: {
          owner: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual({
        nodes: mockBusinesses,
        nextCursor: null,
        totalCount: 3,
      });
    });

    it('should handle next page cursor when more results exist', async () => {
      // Create 3 businesses but we're only requesting 2
      const mockBusinesses = [
        {
          id: 'business-id-1',
          name: 'Business 1',
          description: 'Description 1',
          ownerId: 'user-id-1',
          owner: { id: 'user-id-1' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'business-id-2',
          name: 'Business 2',
          description: 'Description 2',
          ownerId: 'user-id-2',
          owner: { id: 'user-id-2' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'business-id-3',
          name: 'Business 3',
          description: 'Description 3',
          ownerId: 'user-id-3',
          owner: { id: 'user-id-3' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.business.findMany.mockResolvedValue(mockBusinesses);
      mockPrismaService.business.count.mockResolvedValue(5);

      const result = await service.findAll({ take: 2 });

      expect(mockPrismaService.business.findMany).toHaveBeenCalledWith({
        take: 3,
        include: {
          owner: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual({
        nodes: [mockBusinesses[0], mockBusinesses[1]],
        nextCursor: 'business-id-2',
        totalCount: 5,
      });
    });
  });

  describe('findOne', () => {
    it('should return a business when found', async () => {
      const mockBusiness = {
        id: 'business-id',
        name: 'Test Business',
        description: 'A test business description',
        ownerId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-id' },
        tags: [],
      };

      mockPrismaService.business.findUnique.mockResolvedValue(mockBusiness);

      const result = await service.findOne('business-id');

      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'business-id' },
        include: {
          owner: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockBusiness);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          owner: true,
          tags: true,
        },
      });
    });
  });

  describe('findByOwner', () => {
    it('should return businesses for a specific owner', async () => {
      const ownerId = 'user-id';
      const mockBusinesses = [
        {
          id: 'business-id-1',
          name: 'Business 1',
          description: 'Description 1',
          ownerId,
          owner: { id: ownerId },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'business-id-2',
          name: 'Business 2',
          description: 'Description 2',
          ownerId,
          owner: { id: ownerId },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.business.findMany.mockResolvedValue(mockBusinesses);

      const result = await service.findByOwner(ownerId);

      expect(mockPrismaService.business.findMany).toHaveBeenCalledWith({
        where: { ownerId },
        include: {
          owner: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockBusinesses);
    });

    it('should return empty array when owner has no businesses', async () => {
      mockPrismaService.business.findMany.mockResolvedValue([]);

      const result = await service.findByOwner('user-with-no-businesses');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const userId = 'user-id';
    const businessId = 'business-id';
    const updateBusinessInput: UpdateBusinessInput = {
      id: businessId,
      name: 'Updated Business Name',
      description: 'Updated description',
      contactInfo: { phone: '987-654-3210' },
    };

    it('should update a business when user is owner', async () => {
      const mockExistingBusiness = {
        id: businessId,
        ownerId: userId,
        name: 'Original Name',
        description: 'Original description',
        contactInfo: { phone: '123-456-7890' },
        links: { website: 'https://example.com' },
        photos: ['photo1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedBusiness = {
        ...mockExistingBusiness,
        name: updateBusinessInput.name,
        description: updateBusinessInput.description,
        contactInfo: updateBusinessInput.contactInfo,
        owner: { id: userId },
        tags: [],
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );
      mockPrismaService.business.update.mockResolvedValue(mockUpdatedBusiness);

      const result = await service.update(
        userId,
        UserRole.USER,
        updateBusinessInput,
      );

      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(mockPrismaService.business.update).toHaveBeenCalledWith({
        where: { id: businessId },
        data: {
          name: updateBusinessInput.name,
          description: updateBusinessInput.description,
          contactInfo: updateBusinessInput.contactInfo,
        },
        include: {
          owner: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockUpdatedBusiness);
    });

    it('should update a business when user is admin', async () => {
      const differentOwnerId = 'different-user-id';
      const mockExistingBusiness = {
        id: businessId,
        ownerId: differentOwnerId, // Different owner
        name: 'Original Name',
        description: 'Original description',
        contactInfo: { phone: '123-456-7890' },
        links: { website: 'https://example.com' },
        photos: ['photo1.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedBusiness = {
        ...mockExistingBusiness,
        name: updateBusinessInput.name,
        description: updateBusinessInput.description,
        contactInfo: updateBusinessInput.contactInfo,
        owner: { id: differentOwnerId },
        tags: [],
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );
      mockPrismaService.business.update.mockResolvedValue(mockUpdatedBusiness);

      const result = await service.update(
        userId,
        UserRole.ADMIN,
        updateBusinessInput,
      );

      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(mockPrismaService.business.update).toHaveBeenCalledWith({
        where: { id: businessId },
        data: {
          name: updateBusinessInput.name,
          description: updateBusinessInput.description,
          contactInfo: updateBusinessInput.contactInfo,
        },
        include: {
          owner: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockUpdatedBusiness);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, UserRole.USER, updateBusinessInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const differentOwnerId = 'different-user-id';
      const mockExistingBusiness = {
        id: businessId,
        ownerId: differentOwnerId, // Different owner
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );

      await expect(
        service.update(userId, UserRole.USER, updateBusinessInput),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const userId = 'user-id';
    const businessId = 'business-id';

    it('should delete a business when user is owner', async () => {
      const mockExistingBusiness = {
        id: businessId,
        ownerId: userId,
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );
      mockPrismaService.business.delete.mockResolvedValue({});

      const result = await service.remove(userId, UserRole.USER, businessId);

      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(mockPrismaService.business.delete).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(result).toBe(true);
    });

    it('should delete a business when user is admin', async () => {
      const differentOwnerId = 'different-user-id';
      const mockExistingBusiness = {
        id: businessId,
        ownerId: differentOwnerId, // Different owner
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );
      mockPrismaService.business.delete.mockResolvedValue({});

      const result = await service.remove(userId, UserRole.ADMIN, businessId);

      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(mockPrismaService.business.delete).toHaveBeenCalledWith({
        where: { id: businessId },
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(userId, UserRole.USER, businessId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const differentOwnerId = 'different-user-id';
      const mockExistingBusiness = {
        id: businessId,
        ownerId: differentOwnerId, // Different owner
      };

      mockPrismaService.business.findUnique.mockResolvedValue(
        mockExistingBusiness,
      );

      await expect(
        service.remove(userId, UserRole.USER, businessId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
