'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Migration {
  id: string;
  name: string;
  version: number;
  applied_at?: string;
  status: string;
  execution_time_ms?: number;
}

interface MigrationFile {
  name: string;
  version: number;
}

interface MigrationStatus {
  applied: Migration[];
  pending: MigrationFile[];
  validation: {
    valid: boolean;
    issues: string[];
  };
}

export function MigrationDashboard() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrations');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  const runMigrations = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        await fetchStatus();
      } else {
        alert('❌ Failed to run migrations');
      }
    } catch (error) {
      console.error('Error running migrations:', error);
      alert('❌ Error running migrations');
    } finally {
      setRunning(false);
    }
  };
  
  const validateMigrations = async () => {
    setValidating(true);
    try {
      const response = await fetch('/api/migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.valid) {
          alert('✅ All migrations are valid');
        } else {
          alert(`⚠️ Validation issues found:\n${result.issues.join('\n')}`);
        }
        await fetchStatus();
      }
    } catch (error) {
      console.error('Error validating migrations:', error);
    } finally {
      setValidating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading migration status...</span>
      </div>
    );
  }
  
  if (!status) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load migration status</AlertDescription>
      </Alert>
    );
  }
  
  const totalMigrations = status.applied.length + status.pending.length;
  const completionPercentage = totalMigrations > 0 
    ? Math.round((status.applied.length / totalMigrations) * 100)
    : 100;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Migrations</h2>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validateMigrations}
            disabled={validating}
          >
            <Shield className="h-4 w-4 mr-1" />
            {validating ? 'Validating...' : 'Validate'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStatus}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {status.pending.length > 0 && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={runMigrations}
              disabled={running}
            >
              <Play className="h-4 w-4 mr-1" />
              {running ? 'Running...' : `Run ${status.pending.length} Migrations`}
            </Button>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Migrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMigrations}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-2xl font-bold">{status.applied.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <p className="text-2xl font-bold">{status.pending.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {status.validation.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">{status.validation.issues.length} Issues</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Validation Issues */}
      {!status.validation.valid && status.validation.issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {status.validation.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Pending Migrations */}
      {status.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Migrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.pending.map((migration) => (
                <div 
                  key={migration.version}
                  className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{migration.name}</p>
                      <p className="text-sm text-muted-foreground">Version: {migration.version}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Applied Migrations */}
      <Card>
        <CardHeader>
          <CardTitle>Applied Migrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {status.applied.length === 0 ? (
              <p className="text-muted-foreground">No migrations applied yet</p>
            ) : (
              status.applied.slice().reverse().map((migration) => (
                <div 
                  key={migration.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{migration.name}</p>
                      <div className="text-sm text-muted-foreground space-x-2">
                        <span>Version: {migration.version}</span>
                        {migration.execution_time_ms && (
                          <span>• {migration.execution_time_ms}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">Applied</Badge>
                    {migration.applied_at && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(migration.applied_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}