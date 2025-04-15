/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '../../src/auth/models/user.model';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('Business (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  let userToken: string;
  let adminToken: string;
  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let adminId: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    // Clean up the database
    await prismaService.business.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prismaService.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        reserveServiceDescription: 'Reserve service description',
        role: UserRole.USER,
      },
    });
    userId = user.id;
    userToken = jwtService.sign({ sub: user.id, username: user.username });

    // Create admin user
    const admin = await prismaService.user.create({
      data: {
        username: 'adminuser',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '0987654321',
        reserveServiceDescription: 'Admin reserve service description',
        role: UserRole.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwtService.sign({ sub: admin.id, username: admin.username });
  });

  afterAll(async () => {
    // Clean up the database
    await prismaService.business.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('Create Business', () => {
    it('should create a new business when user is authenticated', async () => {
      const businessData = {
        name: 'Test Business',
        description: 'A business description',
        contactInfo: { phone: '123-456-7890', email: 'business@example.com' },
        links: { website: 'https://testbusiness.com' },
        photos: ['photo1.jpg', 'photo2.jpg'],
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            mutation CreateBusiness($input: CreateBusinessInput!) {
              createBusiness(createBusinessInput: $input) {
                id
                name
                description
                contactInfo
                links
                photos
                owner {
                  id
                  username
                }
              }
            }
          `,
          variables: {
            input: businessData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createBusiness).toBeDefined();
      expect(response.body.data.createBusiness.name).toBe(businessData.name);
      expect(response.body.data.createBusiness.description).toBe(
        businessData.description,
      );
      expect(response.body.data.createBusiness.owner.id).toBe(userId);

      businessId = response.body.data.createBusiness.id;
    });

    it('should not create a business when user is not authenticated', async () => {
      const businessData = {
        name: 'Test Business 2',
        description: 'Another business description',
        contactInfo: { phone: '123-456-7890', email: 'business2@example.com' },
        links: { website: 'https://testbusiness2.com' },
        photos: ['photo1.jpg', 'photo2.jpg'],
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateBusiness($input: CreateBusinessInput!) {
              createBusiness(createBusinessInput: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: businessData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('Get Businesses', () => {
    it('should get a list of businesses', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query GetBusinesses($pagination: PaginationInput!) {
              businesses(pagination: $pagination) {
                nodes {
                  id
                  name
                  description
                  owner {
                    id
                    username
                  }
                }
                totalCount
                nextCursor
              }
            }
          `,
          variables: {
            pagination: {
              take: 10,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.businesses).toBeDefined();
      expect(response.body.data.businesses.nodes).toBeInstanceOf(Array);
      expect(response.body.data.businesses.totalCount).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('should get a specific business by ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query GetBusiness($id: ID!) {
              business(id: $id) {
                id
                name
                description
                contactInfo
                links
                photos
                owner {
                  id
                  username
                }
              }
            }
          `,
          variables: {
            id: businessId,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.business).toBeDefined();
      expect(response.body.data.business.id).toBe(businessId);
    });

    it('should get all businesses owned by a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            query GetUserBusinesses {
              userBusinesses {
                id
                name
                description
                owner {
                  id
                  username
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.userBusinesses).toBeDefined();
      expect(response.body.data.userBusinesses).toBeInstanceOf(Array);
      expect(response.body.data.userBusinesses.length).toBeGreaterThanOrEqual(
        1,
      );
      expect(response.body.data.userBusinesses[0].owner.id).toBe(userId);
    });
  });

  describe('Update Business', () => {
    it('should update a business when user is the owner', async () => {
      const updateData = {
        id: businessId,
        name: 'Updated Business Name',
        description: 'Updated business description',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            mutation UpdateBusiness($input: UpdateBusinessInput!) {
              updateBusiness(updateBusinessInput: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateBusiness).toBeDefined();
      expect(response.body.data.updateBusiness.name).toBe(updateData.name);
      expect(response.body.data.updateBusiness.description).toBe(
        updateData.description,
      );
    });

    it('should update a business when user is an admin', async () => {
      const updateData = {
        id: businessId,
        name: 'Admin Updated Business Name',
        description: 'Admin updated business description',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation UpdateBusiness($input: UpdateBusinessInput!) {
              updateBusiness(updateBusinessInput: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateBusiness).toBeDefined();
      expect(response.body.data.updateBusiness.name).toBe(updateData.name);
      expect(response.body.data.updateBusiness.description).toBe(
        updateData.description,
      );
    });

    it('should not update a business when user is not authorized', async () => {
      // Create another regular user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const anotherUser = await prismaService.user.create({
        data: {
          username: 'anotheruser',
          email: 'another@example.com',
          password: hashedPassword,
          firstName: 'Another',
          lastName: 'User',
          phone: '5555555555',
          reserveServiceDescription: 'Another reserve service description',
          role: UserRole.USER,
        },
      });
      const anotherUserToken = jwtService.sign({
        sub: anotherUser.id,
        username: anotherUser.username,
      });

      const updateData = {
        id: businessId,
        name: 'Unauthorized Update',
        description: 'This update should fail',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          query: `
            mutation UpdateBusiness($input: UpdateBusinessInput!) {
              updateBusiness(updateBusinessInput: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'You do not have permission',
      );
    });
  });

  describe('Delete Business', () => {
    it('should not delete a business when user is not authorized', async () => {
      // Using the anotherUser from the previous test
      const anotherUserToken = jwtService.sign({
        sub: 'another-user-id',
        username: 'anotheruser',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          query: `
            mutation RemoveBusiness($id: ID!) {
              removeBusiness(id: $id)
            }
          `,
          variables: {
            id: businessId,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });

    it('should delete a business when user is admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation RemoveBusiness($id: ID!) {
              removeBusiness(id: $id)
            }
          `,
          variables: {
            id: businessId,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.removeBusiness).toBe(true);

      // Verify the business was deleted
      const checkResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query GetBusiness($id: ID!) {
              business(id: $id) {
                id
              }
            }
          `,
          variables: {
            id: businessId,
          },
        });

      expect(checkResponse.body.errors).toBeDefined();
      expect(checkResponse.body.errors[0].message).toContain('not found');
    });
  });
});
