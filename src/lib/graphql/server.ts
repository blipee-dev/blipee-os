import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server instance
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    // Add plugins for logging, caching, etc.
    {
      async requestDidStart() {
        return {
          async didResolveOperation(requestContext) {
            console.log('GraphQL Operation:', requestContext.request.operationName);
          },
          async didEncounterErrors(requestContext) {
            console.error('GraphQL Errors:', requestContext.errors);
          },
        };
      },
    },
  ],
});

// Create context function
async function createContext(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user from Supabase auth
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      // Handle both JWT and API key authentication
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        if (!error && authUser) {
          user = authUser;
        }
      } else if (authHeader.startsWith('ApiKey ')) {
        // Handle API key authentication
        const apiKey = authHeader.substring(7);
        const { data: keyData, error } = await supabase
          .from('api_keys')
          .select('id, organization_id, scopes, status')
          .eq('key_hash', Buffer.from(apiKey).toString('base64'))
          .eq('status', 'active')
          .single();
        
        if (!error && keyData) {
          // Create a synthetic user context for API key access
          user = {
            id: `api_key_${keyData.id}`,
            email: `api_key_${keyData.id}@system`,
            app_metadata: {
              provider: 'api_key',
              api_key_id: keyData.id,
              organization_id: keyData.organization_id,
              scopes: keyData.scopes,
            },
          };
        }
      }
    }
    
    return {
      supabase,
      user,
      req,
    };
  } catch (error) {
    console.error('Error creating GraphQL context:', error);
    return {
      supabase: null,
      user: null,
      req,
    };
  }
}

// Create and export the handler
export const graphqlHandler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: createContext,
});

export { server };