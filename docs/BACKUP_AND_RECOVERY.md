# Backup and Recovery Documentation

## Overview

This document describes the automated backup and disaster recovery procedures for blipee OS.

## Backup Strategy

### Automated Daily Backups
- **Schedule**: Daily at 2:00 AM UTC
- **Retention**: 30 days (configurable)
- **Storage**: AWS S3 with versioning enabled
- **Compression**: tar.gz format
- **Encryption**: AES-256 at rest in S3

### What's Backed Up
- All database tables including:
  - Organizations and settings
  - Buildings and devices
  - Metrics and time-series data
  - Conversations and messages
  - User relationships and permissions
  - Supply chain data
  - Network insights

### Backup Process
1. GitHub Action triggers daily
2. Extracts all data from Supabase
3. Creates JSON files for each table
4. Generates SHA-256 checksums
5. Compresses into tar.gz archive
6. Uploads to S3 bucket
7. Cleans old backups (>30 days)
8. Sends Slack notification

## Recovery Procedures

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours

### How to Restore

#### 1. Latest Backup Restore
```bash
# Download latest backup from S3
aws s3 cp s3://blipee-backups/database-backups/backup-2024-03-25.tar.gz ./

# Restore using the script
npm run backup:restore ./backup-2024-03-25.tar.gz
```

#### 2. Point-in-Time Restore
```bash
# List available backups
aws s3 ls s3://blipee-backups/database-backups/

# Download specific backup
aws s3 cp s3://blipee-backups/database-backups/backup-2024-03-20.tar.gz ./

# Restore
npm run backup:restore ./backup-2024-03-20.tar.gz
```

#### 3. Manual Restore Process
If automated restore fails:

1. Extract the backup:
```bash
tar -xzf backup-2024-03-25.tar.gz
cd backup-2024-03-25
```

2. Verify manifest.json exists and check integrity

3. Use Supabase dashboard or CLI to restore each table:
```sql
-- Example for organizations table
COPY organizations FROM '/path/to/organizations.json' WITH (FORMAT json);
```

## Manual Backup

To create a manual backup:
```bash
# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Run backup
npm run backup:database
```

## Backup Verification

### Automated Verification
- GitHub Action verifies backup exists after creation
- Checksum validation in manifest.json
- File size monitoring for anomalies

### Manual Verification
```bash
# Download and extract backup
tar -tzf backup-2024-03-25.tar.gz

# Check manifest
cat backup-2024-03-25/manifest.json | jq .

# Verify checksums
sha256sum backup-2024-03-25/*.json
```

## Monitoring and Alerts

### Success Notifications
- Slack notification on successful backup
- Includes timestamp and file location

### Failure Alerts
- Immediate Slack alert on failure
- Email to on-call engineer
- PagerDuty escalation after 2 failures

## Security Considerations

1. **Access Control**
   - Service role key stored in GitHub Secrets
   - S3 bucket with IAM restrictions
   - MFA required for manual S3 access

2. **Encryption**
   - Data encrypted in transit (TLS)
   - S3 server-side encryption (AES-256)
   - Backup archives can be encrypted locally

3. **Compliance**
   - Meets GDPR data portability requirements
   - SOC2 backup control satisfied
   - Audit trail maintained

## Testing Recovery

### Monthly Drill
1. Pick random backup from last 30 days
2. Restore to staging environment
3. Verify data integrity
4. Document time taken
5. Update RTO if needed

### Test Commands
```bash
# Test backup creation
npm run backup:database

# Test restore to staging
export SUPABASE_URL=staging_url
npm run backup:restore ./test-backup.tar.gz

# Clean old backups
npm run backup:clean 7  # Keep only 7 days
```

## Troubleshooting

### Common Issues

1. **Backup Fails with Timeout**
   - Increase Lambda/Action timeout
   - Reduce batch size in script
   - Check Supabase rate limits

2. **S3 Upload Fails**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure bucket exists in correct region

3. **Restore Fails**
   - Check Supabase connection
   - Verify table schemas match
   - Look for foreign key violations
   - Try restoring tables in dependency order

### Emergency Contacts
- **Primary**: DevOps On-Call - [PHONE]
- **Secondary**: CTO - [PHONE]
- **Supabase Support**: [TICKET-URL]
- **AWS Support**: [CASE-URL]

## Maintenance

### Weekly Tasks
- Verify backup job is running
- Check S3 storage costs
- Review backup sizes for anomalies

### Monthly Tasks
- Perform recovery drill
- Update documentation
- Review retention policy
- Check backup encryption status

### Quarterly Tasks
- Full disaster recovery test
- Update RTO/RPO targets
- Review and update runbooks
- Audit access permissions