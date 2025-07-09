'use client';

import { useState } from 'react';
import { Play, Book, Code, Zap } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { createGraphQLClient, QUERIES, MUTATIONS } from '@/lib/graphql/client';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

interface ExampleQuery {
  name: string;
  description: string;
  query: string;
  variables?: string;
  type: 'query' | 'mutation' | 'subscription';
}

const exampleQueries: ExampleQuery[] = [
  {
    name: 'Get Organizations',
    description: 'Fetch all organizations for the current user',
    query: QUERIES.GET_ORGANIZATIONS,
    type: 'query',
  },
  {
    name: 'Get Organization Details',
    description: 'Fetch detailed information about a specific organization',
    query: QUERIES.GET_ORGANIZATION,
    variables: JSON.stringify({ id: 'your-org-id' }, null, 2),
    type: 'query',
  },
  {
    name: 'Get Buildings',
    description: 'Fetch all buildings for an organization',
    query: QUERIES.GET_BUILDINGS,
    variables: JSON.stringify({ organizationId: 'your-org-id' }, null, 2),
    type: 'query',
  },
  {
    name: 'Create Building',
    description: 'Create a new building',
    query: MUTATIONS.CREATE_BUILDING,
    variables: JSON.stringify({
      input: {
        organizationId: 'your-org-id',
        name: 'New Building',
        description: 'A sample building',
        address: '123 Main St, City, State',
        buildingType: 'OFFICE',
        floorArea: 10000,
        occupancy: 100,
        yearBuilt: 2020,
      },
    }, null, 2),
    type: 'mutation',
  },
  {
    name: 'Health Check',
    description: 'Check system health status',
    query: QUERIES.GET_HEALTH_CHECK,
    type: 'query',
  },
];

export default function GraphQLPlaygroundPage() {
  const [activeTab, setActiveTab] = useState('playground');
  const [query, setQuery] = useState(QUERIES.GET_ORGANIZATIONS);
  const [variables, setVariables] = useState('{}');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const executeQuery = async () => {
    if (!session?.access_token) {
      setError('Please sign in to use the GraphQL playground');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const client = createGraphQLClient(session.access_token);
      let parsedVariables = {};
      
      if (variables.trim()) {
        try {
          parsedVariables = JSON.parse(variables);
        } catch (e) {
          throw new Error('Invalid JSON in variables');
        }
      }

      const data = await client.query(query, parsedVariables);
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: ExampleQuery) => {
    setQuery(example.query);
    setVariables(example.variables || '{}');
    setResult('');
    setError('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'query':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'mutation':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'subscription':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <GlassCard>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">GraphQL Playground</h1>
              <p className="text-gray-400">
                Please sign in to access the GraphQL playground
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">GraphQL Playground</h1>
          <p className="text-gray-400">
            Explore and test the blipee OS GraphQL API
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1">
          {[
            { id: 'playground', label: 'Playground', icon: Play },
            { id: 'examples', label: 'Examples', icon: Code },
            { id: 'docs', label: 'Documentation', icon: Book },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Editor */}
            <GlassCard>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Query Editor</h2>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    GraphQL Query/Mutation
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your GraphQL query here..."
                    className="w-full h-64 p-3 bg-black/50 border border-white/10 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Variables (JSON)
                  </label>
                  <textarea
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    placeholder='{"organizationId": "your-org-id"}'
                    className="w-full h-24 p-3 bg-black/50 border border-white/10 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <GradientButton
                  onClick={executeQuery}
                  disabled={loading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loading ? 'Executing...' : 'Execute Query'}
                </GradientButton>
              </div>
            </GlassCard>

            {/* Results */}
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Results</h2>
                </div>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                    <div className="text-red-400 text-sm">
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                )}
                
                <div className="h-96 overflow-auto">
                  <pre className="text-sm bg-black/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                    {result || (loading ? 'Executing query...' : 'Execute a query to see results')}
                  </pre>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exampleQueries.map((example, index) => (
              <GlassCard key={index} className="cursor-pointer hover:bg-white/5 transition-all">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{example.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(example.type)}`}>
                      {example.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {example.description}
                  </p>
                  <button
                    onClick={() => loadExample(example)}
                    className="w-full px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all text-sm"
                  >
                    Load Example
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Authentication</h2>
                <p className="text-gray-400 text-sm mb-4">
                  The GraphQL API supports two authentication methods:
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="text-white font-medium">JWT Token:</h4>
                    <pre className="mt-1 p-2 bg-black/50 border border-white/10 rounded text-xs text-gray-300">
Authorization: Bearer &lt;jwt_token&gt;
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">API Key:</h4>
                    <pre className="mt-1 p-2 bg-black/50 border border-white/10 rounded text-xs text-gray-300">
Authorization: ApiKey &lt;api_key&gt;
                    </pre>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Available Operations</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor('query')}`}>
                      Queries
                    </span>
                    <p className="mt-1 text-gray-400">
                      Read data: organizations, buildings, users, API keys, webhooks, metrics
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor('mutation')}`}>
                      Mutations
                    </span>
                    <p className="mt-1 text-gray-400">
                      Modify data: create/update/delete buildings, API keys, webhooks
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor('subscription')}`}>
                      Subscriptions
                    </span>
                    <p className="mt-1 text-gray-400">
                      Real-time updates: building changes, alerts, system health
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">GraphQL Endpoints</h2>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-white font-medium">HTTP Endpoint:</h4>
                    <pre className="mt-1 p-2 bg-black/50 border border-white/10 rounded text-sm text-gray-300">
POST /api/graphql
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">WebSocket Endpoint (Subscriptions):</h4>
                    <pre className="mt-1 p-2 bg-black/50 border border-white/10 rounded text-sm text-gray-300">
WS /api/graphql
                    </pre>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}