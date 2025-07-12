import type { Database } from '../database';

describe('Database types', () => {
  it('should export Database type', () => {
    // Type testing - ensures the type is exported and can be used
    const testDb: Partial<Database> = {
      public: {
        Tables: {},
        Views: {},
        Functions: {},
        Enums: {},
        CompositeTypes: {}
      }
    };
    expect(testDb).toBeDefined();
  });

  it('should have public schema', () => {
    type PublicSchema = Database['public'];
    const schema: Partial<PublicSchema> = {
      Tables: {},
      Views: {},
      Functions: {},
      Enums: {},
      CompositeTypes: {}
    };
    expect(schema).toBeDefined();
  });

  it('should allow table type access', () => {
    // This ensures the nested types are accessible
    type Tables = Database['public']['Tables'];
    const tables: Partial<Tables> = {};
    expect(tables).toBeDefined();
  });
});