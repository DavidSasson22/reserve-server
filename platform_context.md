# Platform Overview
This platform aims to support Israeli soldiers in reserve duty who own businesses by providing a space to showcase their enterprises. It will allow logged-in users to publish business details, including data, owner information, photos, links, contact info, and tags (like location, area, field). An admin user will manage these businesses, with the site designed for easy Google discoverability and themed in blue, white, and olive to reflect the Israeli flag and army uniform.

## Technical Stack and Features
- **Front-End**: Using Next.js (built on React) for server-side rendering (SSR) to improve SEO, ensuring the site is easily found on Google. This choice, while not explicitly requested, enhances visibility.
- **Back-End**: Nest.js will handle the server-side logic, with GraphQL chosen for flexible data queries and PostgreSQL via Prisma for database management, supporting structured data like users, businesses, and tags.
- **Security**: The back-end will be secured with JWT authentication, input validation, and rate limiting to protect against attacks.
- **Design**: The theme will incorporate blue, white, and olive colors, using Tailwind CSS for styling, ensuring a professional look that resonates with the target audience.

## Additional Features for Success
To boost engagement, consider:
- Search and filter options for visitors to find businesses by name, location, or category.
- User profiles for business owners to manage their listings.
- Future additions like reviews, ratings, and social sharing to build community and attract customers.

## Deployment
For fast and easy deployment, the back-end will use Heroku with a PostgreSQL add-on, while the front-end will leverage Vercel for optimal performance, ensuring quick setup and scalability.

## Survey Note: Detailed Implementation Plan
This section provides a comprehensive breakdown of the platform's development, covering technical decisions, feature implementation, and deployment strategies, ensuring all aspects are addressed for a successful launch.

### Background and Objectives
The platform is designed to support Israeli soldiers in reserve duty who own businesses, addressing their economic challenges by providing visibility. The goal is to create a user-friendly, secure, and SEO-optimized platform, with features for publishing businesses, admin management, and potential for community engagement.

### Technical Stack Selection
- **Front-End**: Initially, the user specified React, but given the need for SEO (to be easily found on Google), Next.js is recommended. Next.js supports server-side rendering (SSR), which is crucial for search engine indexing. This choice enhances performance and visibility, aligning with the requirement for Google discoverability.
- **Back-End**: Nest.js is chosen for its robust features, with GraphQL selected over REST for flexible querying, especially useful for filtering businesses by tags or location. PostgreSQL, managed via Prisma, is opted for its relational capabilities, suitable for structured data like users, businesses, and tags.
- **Database and Architecture**: A monolith architecture is preferred for simplicity and fast deployment, with PostgreSQL ensuring scalability for initial needs. Microservices can be considered later if the platform grows.

### Feature Implementation
#### User and Business Management
- **User Roles**: The platform will have regular users (soldiers/business owners) and admin users. Regular users can log in to publish businesses, while admins can add, delete, or modify any business. Authentication will use JWT, with roles ('user' or 'admin') defined in the User model.
- **Business Page Details**: Each business page will include:
  - Data about the business (name, description).
  - Owner information (bio, contact details).
  - Photos (handled via cloud storage like Cloudinary for security).
  - Links (website, social media).
  - Contact info (email, phone).
  - Tags, categorized by type (location, area, field), with predefined options for consistency (e.g., cities in Israel for location, regions like North/South for area, categories like restaurants for field).

#### Admin Functionality
Admins will have a dashboard to list, search, filter, edit, and delete businesses, with authorization checks ensuring only admins or owners can modify specific businesses.

#### SEO and Design
- **SEO**: Next.js's SSR capabilities will ensure pages are crawlable, with meta tags, sitemaps, and structured data implemented for rich snippets. Submitting to Google Search Console will aid indexing.
- **Design**: The theme will use blue, white, and olive colors, reflecting the Israeli flag and army uniform. Tailwind CSS will be customized with a palette (e.g., primary blue #0070f3, secondary olive #556b2f, background white #ffffff), ensuring readability and professionalism. Support for Hebrew (RTL layout) will be included for local users.

#### Additional Features for Engagement
To enhance success, consider:
- **Search and Filter**: Allow visitors to search by business name or filter by tags (location, area, field), improving discoverability.
- **User Profiles**: Owners can view and manage their businesses, with options to edit or create new listings.
- **Future Enhancements**: Reviews and ratings, favorites/bookmarks, social sharing, map integration for physical locations, and analytics for business owners to track views. Multi-language support (Hebrew/English) and accessibility features will broaden reach.

### Security Measures
- **Authentication and Authorization**: JWT will secure user sessions, with guards in Nest.js ensuring role-based access (e.g., only admins can delete businesses).
- **Data Validation**: Nest.js validation pipes will prevent injection attacks, with parameterized queries via Prisma mitigating SQL injection.
- **Communication**: HTTPS will be enforced, with CORS configured to restrict API access.
- **Rate Limiting**: Implemented to prevent abuse, such as brute-force login attempts.
- **Image Uploads**: Secured via cloud storage services, with validation to prevent malicious content.

### Deployment Strategy
- **Back-End on Heroku**: Set up a Heroku app, add a PostgreSQL add-on, configure environment variables (e.g., DATABASE_URL, JWT_SECRET), and deploy using git push heroku main. This ensures fast setup, aligning with the user's preference for ease.
- **Front-End on Vercel**: Push the Next.js code to GitHub, connect to Vercel, set environment variables (e.g., API URL), and deploy automatically on push. Vercel optimizes front-end performance, ideal for static content and SSR.

### Implementation Steps
#### Back-End (Nest.js)
1. Create a new Nest.js project: nest new backend.
2. Install dependencies: @nestjs/graphql, graphql, apollo-server-express, @prisma/client, prisma, @nestjs/jwt, passport-jwt.
3. Set up Prisma: Initialize with npx prisma init, define schema (see table below for models), and generate client with npx prisma generate.
4. Create modules (e.g., nest g module auth, nest g module users) and implement JWT authentication.
5. Define GraphQL schema and resolvers, including queries (e.g., getBusinesses, business) and mutations (e.g., createBusiness, deleteBusiness).
6. Implement services for business logic and handle image uploads via cloud storage.

#### Front-End (Next.js)
1. Create a new Next.js project: npx create-next-app frontend.
2. Install dependencies: @apollo/client, graphql, tailwindcss, postcss, autoprefixer.
3. Set up Tailwind CSS: npx tailwindcss init -p, customize colors in tailwind.config.js.
4. Configure Apollo Client in _app.js to connect to the back-end GraphQL API.
5. Create pages (Home, BusinessDetail, UserProfile, AdminDashboard, Login, Register) using SSR with getServerSideProps for SEO.
6. Implement authentication, storing JWT tokens, and ensure RTL support for Hebrew.

### Database Models
Below is a summary of the database schema:

| Model | Fields |
|-------|--------|
| User | id, username, email, password (hashed), role (USER/ADMIN), businesses[] |
| Business | id, name, description, ownerId, contactInfo (JSON), links (JSON), photos (String[]), tags[] |
| Tag | id, name, type (LOCATION/AREA/FIELD), businesses[] |

### Example Code Snippets
#### Back-End GraphQL Schema (partial):
```graphql
type Query {
  businesses(search: String, tags: [ID]): [Business]
  business(id: ID!): Business
}

type Mutation {
  createBusiness(input: CreateBusinessInput!): Business
  deleteBusiness(id: ID!): Boolean
}
```

#### Front-End Next.js Page (BusinessDetail):
```jsx
import Head from 'next/head';

function BusinessPage({ business }) {
  return (
    <>
      <Head>
        <title>{business.name} - Business Details</title>
        <meta name="description" content={business.description} />
      </Head>
      <div className="bg-white text-primary">
        <h1>{business.name}</h1>
        <p>{business.description}</p>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const business = await fetchBusiness(id);
  return { props: { business } };
}
```

### Considerations and Challenges
- **Verification of Soldier Status**: Initially, the platform is open to any logged-in user, but future verification (e.g., military ID) could ensure targeting, though this adds complexity.
- **Tag Management**: Predefined tags (e.g., cities, regions, categories) will be seeded, with potential for user suggestions later.
- **Scalability**: Starting with a monolith is suitable, but monitoring performance will inform future microservices adoption.

### Conclusion
This implementation plan ensures a secure, SEO-optimized, and user-friendly platform, with room for growth through additional features. Deployment on Heroku and Vercel aligns with the user's desire for fast setup, while the chosen stack supports long-term maintainability.

### Key Citations
- Nest.js Official Documentation
- Next.js Official Documentation
- Prisma Official Documentation
- Apollo Client Official Documentation
- Tailwind CSS Official Documentation
- Heroku Developer Center
- Vercel Documentation 