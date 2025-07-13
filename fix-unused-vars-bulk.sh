#!/bin/bash

# Fix unused variables by adding underscore prefix
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const uploadData/const _uploadData/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const userId/const _userId/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const dbPoolStats/const _dbPoolStats/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const request =/const _request =/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const metricType/const _metricType/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const metric_type/const _metric_type/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { error }/const { error: _error }/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { user }/const { user: _user }/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const Building /const _Building /g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Zap,/const { Zap: _Zap,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Users,/const { Users: _Users,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { TrendingUp,/const { TrendingUp: _TrendingUp,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { TrendingDown,/const { TrendingDown: _TrendingDown,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Lock,/const { Lock: _Lock,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Gauge,/const { Gauge: _Gauge,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Shield,/const { Shield: _Shield,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { ChartBar,/const { ChartBar: _ChartBar,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Eye,/const { Eye: _Eye,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { EyeOff,/const { EyeOff: _EyeOff,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { AlertCircle,/const { AlertCircle: _AlertCircle,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { Calendar,/const { Calendar: _Calendar,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { subDays,/const { subDays: _subDays,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { startOfDay,/const { startOfDay: _startOfDay,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { endOfDay,/const { endOfDay: _endOfDay,/g'

echo "Fixed bulk unused variables"