# People Counting Sensor Integration Guide

## Supported Sensors

### 1. ViewSonic VS133 (Primary)
- **Protocol**: HTTP POST
- **Format**: CSV
- **Frequency**: Every 5 minutes
- **Authentication**: API Key

### 2. Axis People Counter
- **Protocol**: MQTT / HTTP
- **Format**: JSON
- **Frequency**: Real-time
- **Authentication**: Basic Auth

### 3. Hikvision People Counting
- **Protocol**: HTTP GET (polling)
- **Format**: XML
- **Frequency**: Configurable
- **Authentication**: Digest Auth

### 4. Generic HTTP Integration
- **Protocol**: HTTP POST
- **Format**: JSON/CSV
- **Frequency**: Flexible
- **Authentication**: Bearer Token

## Integration Methods

### Method 1: Direct HTTP Push (Recommended)

Sensors push data directly to our API endpoint:

```http
POST https://retail.blipee.ai/api/retail/sensors/data
Authorization: Bearer <sensor-api-token>
Content-Type: application/json

{
  "sensor_id": "SENSOR001",
  "store_code": "DTF001",
  "timestamp": "2024-01-01T12:00:00Z",
  "counts": {
    "in": 15,
    "out": 12
  },
  "metadata": {
    "accuracy": 95.5,
    "temperature": 22.5
  }
}
```

### Method 2: CSV File Upload

For batch uploads or legacy systems:

```http
POST https://retail.blipee.ai/api/retail/sensors/upload
Authorization: Bearer <sensor-api-token>
Content-Type: multipart/form-data

File format (CSV):
timestamp,sensor_id,in,out,accuracy
2024-01-01 12:00:00,SENSOR001,15,12,95.5
2024-01-01 12:05:00,SENSOR001,8,10,94.2
```

### Method 3: FTP/SFTP Collection

For sensors that only support file drops:

```yaml
FTP Server: ftp.retail.blipee.ai
Port: 21 (FTP) / 22 (SFTP)
Directory: /incoming/[store_code]/
Username: [provided]
Password: [provided]
```

### Method 4: Email Attachment

For simple installations:

```yaml
Email: sensors@retail.blipee.ai
Subject: SENSOR_DATA [store_code] [date]
Attachment: data.csv
```

## Sensor Configuration Examples

### ViewSonic VS133 Configuration

```ini
# VS133 Configuration File
[Server]
URL=https://retail.blipee.ai/api/retail/sensors/data
Method=POST
Format=JSON

[Authentication]
Type=Bearer
Token=your-sensor-api-token

[Data]
StoreCode=DTF001
SensorID=VS133-001
Interval=300

[Network]
Timeout=30
Retry=3
```

### Axis People Counter Setup

```javascript
// Axis VAPIX Configuration
{
  "apiVersion": "1.0",
  "method": "configureCounter",
  "params": {
    "counter": 1,
    "webhook": {
      "url": "https://retail.blipee.ai/api/retail/sensors/axis",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer your-sensor-api-token"
      }
    },
    "interval": 60,
    "aggregation": "sum"
  }
}
```

### Hikvision ISAPI Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PeopleCounting>
    <enabled>true</enabled>
    <reportUrl>https://retail.blipee.ai/api/retail/sensors/hikvision</reportUrl>
    <reportInterval>300</reportInterval>
    <authentication>
        <type>bearer</type>
        <token>your-sensor-api-token</token>
    </authentication>
    <storeInfo>
        <storeCode>DTF001</storeCode>
        <sensorId>HIK-001</sensorId>
    </storeInfo>
</PeopleCounting>
```

## Data Validation Rules

### Required Fields
- `sensor_id`: Unique identifier for the sensor
- `timestamp`: ISO 8601 format (UTC)
- `count_in`: Non-negative integer
- `count_out`: Non-negative integer

### Optional Fields
- `accuracy`: Percentage (0-100)
- `temperature`: Environmental data
- `humidity`: Environmental data
- `zone`: For multi-zone sensors

### Validation Rules
1. Timestamps must not be in the future
2. Timestamps must not be older than 7 days
3. Count values must be non-negative
4. Count values must be reasonable (< 10000 per interval)
5. Duplicate timestamps for same sensor are rejected

## Error Handling

### Common Errors

#### 1. Authentication Failed
```json
{
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid sensor API token",
    "status": 401
  }
}
```

#### 2. Invalid Data Format
```json
{
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Count values must be non-negative integers",
    "field": "count_in",
    "status": 400
  }
}
```

#### 3. Duplicate Data
```json
{
  "error": {
    "code": "DUPLICATE_DATA",
    "message": "Data for this timestamp already exists",
    "sensor_id": "SENSOR001",
    "timestamp": "2024-01-01T12:00:00Z",
    "status": 409
  }
}
```

### Retry Strategy

```yaml
Retry Configuration:
  - Initial delay: 1 second
  - Max retries: 3
  - Backoff multiplier: 2
  - Max delay: 30 seconds
  
Retry on:
  - Network errors
  - 5xx server errors
  - 429 rate limit errors
  
Don't retry on:
  - 4xx client errors (except 429)
  - Authentication errors
```

## Best Practices

### 1. Time Synchronization
- Ensure sensor clocks are synchronized via NTP
- Use UTC timestamps to avoid timezone issues
- Include timezone info if using local time

### 2. Data Buffering
- Buffer data locally if connection fails
- Implement queue with max size (e.g., 1000 records)
- Send buffered data when connection restored

### 3. Compression
- Use gzip compression for large payloads
- Set header: `Content-Encoding: gzip`
- Reduces bandwidth by ~70%

### 4. Batch Sending
- Group multiple readings in one request
- Max batch size: 100 records
- Reduces API calls and improves efficiency

Example batch request:
```json
{
  "sensor_id": "SENSOR001",
  "store_code": "DTF001",
  "batch": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "in": 15,
      "out": 12
    },
    {
      "timestamp": "2024-01-01T12:05:00Z",
      "in": 8,
      "out": 10
    }
  ]
}
```

## Testing & Validation

### Test Endpoint
```http
POST https://retail.blipee.ai/api/retail/sensors/test
```

Use this endpoint to validate your integration without affecting production data.

### Sensor Health Check
```http
GET https://retail.blipee.ai/api/retail/sensors/health/:sensor_id
```

Returns sensor status and last seen information:
```json
{
  "sensor_id": "SENSOR001",
  "status": "healthy",
  "last_seen": "2024-01-01T12:05:00Z",
  "last_7_days": {
    "records_received": 2016,
    "error_rate": 0.2,
    "avg_delay": 15.3
  }
}
```

## Support

### Integration Support
- Email: retail-support@blipee.ai
- Documentation: https://docs.blipee.ai/retail/sensors
- Status Page: https://status.blipee.ai

### Troubleshooting Checklist
1. ✓ Verify API token is correct
2. ✓ Check network connectivity
3. ✓ Validate timestamp format
4. ✓ Ensure sensor_id matches configuration
5. ✓ Check firewall rules for HTTPS (443)
6. ✓ Verify data format matches specification
7. ✓ Test with single record before batch
8. ✓ Check sensor health endpoint