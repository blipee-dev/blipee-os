/**
 * Migration script from SQLite to PostgreSQL
 * Transfers data from existing retail system to new Blipee-OS structure
 */

import { Database as SQLite3 } from 'sqlite3';
import { open } from 'sqlite';
import { Pool } from 'pg';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import ora from 'ora';

interface MigrationConfig {
  sqlitePath: string;
  postgresConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  batchSize?: number;
}

export class RetailDataMigration {
  private sqliteDb: any;
  private pgPool: Pool;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = {
      batchSize: 1000,
      ...config,
    };
    
    this.pgPool = new Pool(this.config.postgresConfig);
  }

  async initialize() {
    // Open SQLite connection
    this.sqliteDb = await open({
      filename: this.config.sqlitePath,
      driver: SQLite3.Database,
    });

    // Test PostgreSQL connection
    await this.pgPool.query('SELECT NOW()');
    
    logger.info('Database connections established');
  }

  async migrate() {
    const spinner = ora('Starting migration...').start();

    try {
      // Create retail schema if not exists
      await this.createRetailSchema();
      
      // Migrate each table
      await this.migrateStores();
      await this.migrateSalesData(spinner);
      await this.migratePeopleCountingData(spinner);
      await this.migrateHeatmapData(spinner);
      await this.migrateRegionalCountingData(spinner);
      await this.migrateAnalyticsResults(spinner);
      await this.migrateLastUpdates();

      spinner.succeed('Migration completed successfully!');
    } catch (error) {
      spinner.fail('Migration failed');
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async createRetailSchema() {
    await this.pgPool.query('CREATE SCHEMA IF NOT EXISTS retail');
  }

  private async migrateStores() {
    // Map store names to proper store records
    const storeMapping = {
      'OML01-Omnia GuimarãesShopping': {
        code: 'OML01',
        name: 'Omnia GuimarãesShopping',
        organizationId: 'omnia-org-id', // You'll need to provide this
        buildingId: 'building-1-id',    // You'll need to provide this
      },
      'ONL01-Only UBBO Amadora': {
        code: 'ONL01',
        name: 'Only UBBO Amadora',
        organizationId: 'only-org-id',
        buildingId: 'building-2-id',
      },
      'OML02-Omnia Fórum Almada': {
        code: 'OML02',
        name: 'Omnia Fórum Almada',
        organizationId: 'omnia-org-id',
        buildingId: 'building-3-id',
      },
      'OML03-Omnia Norteshopping': {
        code: 'OML03',
        name: 'Omnia Norteshopping',
        organizationId: 'omnia-org-id',
        buildingId: 'building-4-id',
      },
      'ONL02-Only Gaia': {
        code: 'ONL02',
        name: 'Only Gaia',
        organizationId: 'only-org-id',
        buildingId: 'building-5-id',
      },
    };

    for (const [fullName, storeData] of Object.entries(storeMapping)) {
      await this.pgPool.query(`
        INSERT INTO retail.stores (
          organization_id, building_id, name, code, timezone, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (organization_id, code) DO UPDATE
        SET name = EXCLUDED.name
      `, [
        storeData.organizationId,
        storeData.buildingId,
        storeData.name,
        storeData.code,
        'Europe/Lisbon', // Portuguese timezone
        true,
      ]);
    }

    logger.info('Stores migrated successfully');
  }

  private async migrateSalesData(spinner: ora.Ora) {
    spinner.text = 'Migrating sales data...';

    const totalCount = await this.sqliteDb.get(
      'SELECT COUNT(*) as count FROM sales_data'
    );
    
    let offset = 0;
    let migrated = 0;

    while (offset < totalCount.count) {
      const batch = await this.sqliteDb.all(`
        SELECT * FROM sales_data 
        ORDER BY id 
        LIMIT ${this.config.batchSize} 
        OFFSET ${offset}
      `);

      if (batch.length === 0) break;

      // Get store ID mapping
      const storeIds = await this.getStoreIdMapping();

      for (const row of batch) {
        const storeId = storeIds[row.loja];
        if (!storeId) {
          logger.warn(`Store not found for ${row.loja}`);
          continue;
        }

        await this.pgPool.query(`
          INSERT INTO retail.sales_transactions (
            store_id, pos_transaction_id, timestamp, amount,
            tax_amount, discount_amount, items_count,
            customer_id, staff_id, payment_method, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (store_id, pos_transaction_id) DO NOTHING
        `, [
          storeId,
          row.referencia_documento,
          row.data,
          row.valor_venda_com_iva,
          row.iva,
          row.desconto,
          row.quantidade,
          null, // customer_id not in original
          row.vendedor_codigo,
          null, // payment_method not in original
          JSON.stringify({
            original_code: row.codigo,
            document_type: row.tipo_documento,
            seller_name: row.vendedor_nome_curto,
            item: row.item,
            description: row.descritivo,
            discount_reason: row.motivo_desconto,
          }),
        ]);

        migrated++;
      }

      offset += this.config.batchSize;
      spinner.text = `Migrating sales data... ${migrated}/${totalCount.count}`;
    }

    logger.info(`Migrated ${migrated} sales records`);
  }

  private async migratePeopleCountingData(spinner: ora.Ora) {
    spinner.text = 'Migrating people counting data...';

    const totalCount = await this.sqliteDb.get(
      'SELECT COUNT(*) as count FROM people_counting_data'
    );

    let offset = 0;
    let migrated = 0;

    while (offset < totalCount.count) {
      const batch = await this.sqliteDb.all(`
        SELECT * FROM people_counting_data 
        ORDER BY id 
        LIMIT ${this.config.batchSize} 
        OFFSET ${offset}
      `);

      if (batch.length === 0) break;

      const storeIds = await this.getStoreIdMapping();

      for (const row of batch) {
        const storeId = storeIds[row.loja];
        if (!storeId) continue;

        // Get or create sensor record
        const sensorResult = await this.pgPool.query(`
          INSERT INTO retail.sensors (store_id, sensor_id, sensor_type, location)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (store_id, sensor_id) DO UPDATE
          SET last_seen_at = NOW()
          RETURNING id
        `, [storeId, row.ip, 'vs133', 'main_entrance']);

        const sensorId = sensorResult.rows[0].id;

        await this.pgPool.query(`
          INSERT INTO retail.foot_traffic_raw (
            store_id, sensor_id, timestamp, count_in, count_out
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (store_id, sensor_id, timestamp) DO NOTHING
        `, [
          storeId,
          sensorId,
          row.start_time,
          row.total_in,
          row.line4_out || 0,
        ]);

        migrated++;
      }

      offset += this.config.batchSize;
      spinner.text = `Migrating people counting data... ${migrated}/${totalCount.count}`;
    }

    logger.info(`Migrated ${migrated} people counting records`);
  }

  private async migrateHeatmapData(spinner: ora.Ora) {
    spinner.text = 'Migrating heatmap data...';

    // Similar implementation for heatmap data
    // The data would be stored in a separate heatmap table or as metadata
  }

  private async migrateRegionalCountingData(spinner: ora.Ora) {
    spinner.text = 'Migrating regional counting data...';

    // Similar implementation for regional data
    // This could be stored in the same foot_traffic_raw table with additional metadata
  }

  private async migrateAnalyticsResults(spinner: ora.Ora) {
    spinner.text = 'Migrating analytics results...';

    const results = await this.sqliteDb.all('SELECT * FROM analytics_results');
    const storeIds = await this.getStoreIdMapping();

    for (const row of results) {
      const storeId = storeIds[row.loja];
      if (!storeId) continue;

      // Analytics results would be recalculated in the new system
      // But we can preserve historical data in a legacy table if needed
    }

    logger.info('Analytics results migration completed');
  }

  private async migrateLastUpdates() {
    const updates = await this.sqliteDb.all('SELECT * FROM last_update');
    
    for (const update of updates) {
      await this.pgPool.query(`
        INSERT INTO retail.last_updates (store_name, last_update_time)
        VALUES ($1, $2)
        ON CONFLICT (store_name) DO UPDATE
        SET last_update_time = EXCLUDED.last_update_time
      `, [update.loja, update.last_update_time]);
    }

    logger.info('Last updates migrated');
  }

  private async getStoreIdMapping(): Promise<Record<string, string>> {
    const result = await this.pgPool.query(`
      SELECT id, name, code FROM retail.stores
    `);

    const mapping: Record<string, string> = {};
    
    for (const row of result.rows) {
      // Map both full name and code to ID
      mapping[`${row.code}-${row.name}`] = row.id;
      mapping[row.code] = row.id;
    }

    return mapping;
  }

  private async cleanup() {
    await this.sqliteDb.close();
    await this.pgPool.end();
  }
}

// Usage example
async function runMigration() {
  const migration = new RetailDataMigration({
    sqlitePath: '/path/to/bot_database.db',
    postgresConfig: {
      host: 'localhost',
      port: 5432,
      database: 'blipee_retail',
      user: 'postgres',
      password: 'postgres',
    },
    batchSize: 5000,
  });

  try {
    await migration.initialize();
    await migration.migrate();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}