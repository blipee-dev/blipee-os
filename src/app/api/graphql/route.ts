import { graphqlHandler } from '@/lib/graphql/server';

// Export HTTP methods for GraphQL endpoint
export { graphqlHandler as GET, graphqlHandler as POST };

// Configure dynamic rendering for GraphQL
export const dynamic = 'force-dynamic';