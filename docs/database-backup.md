# Database Backup and Restore System

## Overview

The database backup and restore system provides comprehensive data protection with support for multiple formats, compression, scheduled backups, and granular restore options.

## Features

- **Multiple Formats**: SQL, JSON, CSV backup formats
- **Compression**: Optional gzip compression for space efficiency
- **Selective Backup**: Backup specific tables or entire database
- **Schema-Only Mode**: Backup structure without data
- **Scheduled Backups**: Automated backups with cron expressions
- **Secure Storage**: Local file storage with metadata tracking
- **Restore Options**: Full or partial restore with safety options

## Setup

1. **Apply the database migration**:
   ```bash
   npx supabase db push
   ```
   This creates the necessary database functions and backup history table.

2. **Create backup directory**:
   The system automatically creates a `.backups` directory in your project root.

3. **Configure environment** (optional):
   ```bash
   BACKUP_DIR=/custom/backup/path  # Custom backup directory
   TZ=America/New_York            # Timezone for scheduled backups
   ```

## API Endpoints

### GET /api/backup
List all available backups.

### POST /api/backup
Create a new backup with options:
```json
{
  "tables": ["organizations", "buildings"],  // Optional, empty for all
  "format": "sql",                          // sql, json, or csv
  "compress": true,                         // Enable gzip compression
  "excludeData": ["large_table"],          // Tables to exclude data from
  "includeSchemaOnly": false               // Only backup schema
}
```

### PUT /api/backup
Restore from a backup:
```json
{
  "backupId": "backup_123456_abc",
  "tables": ["specific_table"],     // Optional, restore specific tables
  "dropExisting": false,            // Drop tables before restore
  "skipConstraints": false          // Skip foreign key constraints
}
```

### DELETE /api/backup/{backupId}
Delete a specific backup file.

## Programmatic Usage

### Creating Backups

```typescript
import { databaseBackup } from '@/lib/database/backup';

// Create full backup
const backup = await databaseBackup.createBackup({
  format: 'sql',
  compress: true
});

// Create partial backup
const partialBackup = await databaseBackup.createBackup({
  tables: ['organizations', 'users'],
  format: 'json',
  compress: true
});

// Schema-only backup
const schemaBackup = await databaseBackup.createBackup({
  includeSchemaOnly: true,
  format: 'sql'
});
```

### Restoring Backups

```typescript
// Full restore
await databaseBackup.restoreBackup(backupId);

// Selective restore
await databaseBackup.restoreBackup(backupId, {
  tables: ['organizations'],
  dropExisting: true
});
```

### Scheduled Backups

```typescript
import { scheduledBackupService } from '@/lib/database/scheduled-backup';

// Schedule daily backup at 2 AM
scheduledBackupService.scheduleBackup({
  id: 'daily-backup',
  name: 'Daily Full Backup',
  schedule: '0 2 * * *',  // Cron expression
  options: {
    format: 'sql',
    compress: true
  },
  enabled: true
});

// Run backup immediately
await scheduledBackupService.runBackupNow('daily-backup');

// List scheduled backups
const schedules = scheduledBackupService.getScheduledBackups();
```

## Backup Formats

### SQL Format
- Complete DDL and DML statements
- Preserves all constraints and indexes
- Best for full database restore
- Human-readable

### JSON Format
- Structured data with metadata
- Easy to parse and transform
- Good for selective data import
- Supports partial restore

### CSV Format
- Simple tabular format
- Good for data export/import
- Compatible with spreadsheets
- Limited metadata support

## Security Considerations

1. **Access Control**: Only admin users can create/restore backups
2. **File Storage**: Backups stored outside web root
3. **Compression**: Reduces file size and obscures content
4. **Metadata Tracking**: All backups logged in database
5. **Gitignore**: Backup files excluded from version control

## Best Practices

1. **Regular Backups**: Schedule daily backups for critical data
2. **Test Restores**: Periodically verify backup integrity
3. **Offsite Storage**: Copy backups to remote storage
4. **Retention Policy**: Delete old backups to save space
5. **Monitor Failures**: Set up alerts for backup failures

## Troubleshooting

### Backup Fails
- Check disk space
- Verify database permissions
- Review error logs

### Restore Fails
- Check backup file integrity
- Verify table compatibility
- Consider using skipConstraints option

### Large Database Issues
- Use compression
- Backup specific tables
- Consider schema-only backups
- Implement incremental backups

## Testing

Run the backup system tests:
```bash
npm run test:backup
```

This will:
1. Create test backups
2. List available backups
3. Verify restore capability
4. Clean up test data

## Cron Expression Examples

- `0 2 * * *` - Daily at 2 AM
- `0 */4 * * *` - Every 4 hours
- `0 3 * * 0` - Weekly on Sunday at 3 AM
- `0 0 1 * *` - Monthly on the 1st at midnight
- `*/30 * * * *` - Every 30 minutes

## Future Enhancements

- Cloud storage integration (S3, Google Cloud Storage)
- Incremental backups
- Point-in-time recovery
- Backup encryption
- Automated retention policies
- Email notifications
- Backup verification checksums