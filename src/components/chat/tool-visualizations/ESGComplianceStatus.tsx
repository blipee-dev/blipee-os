'use client';

/**
 * ESG Compliance Status Visualization Component
 *
 * Displays compliance status with:
 * - Overall compliance score
 * - Framework-specific status
 * - Action items and recommendations
 * - Risk indicators
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ComplianceItem {
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
  score?: number;
  requirements?: string[];
  gaps?: string[];
}

interface ESGComplianceData {
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  overallScore?: number;
  frameworks?: ComplianceItem[];
  recommendations?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  lastAssessment?: string;
}

interface ESGComplianceStatusProps {
  data: ESGComplianceData;
}

export function ESGComplianceStatus({ data }: ESGComplianceStatusProps) {
  // Get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'compliant':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Compliant',
          variant: 'default' as const
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Partial Compliance',
          variant: 'secondary' as const
        };
      case 'non_compliant':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Non-Compliant',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          variant: 'outline' as const
        };
    }
  };

  const overallConfig = getStatusConfig(data.overallStatus);
  const OverallIcon = overallConfig.icon;

  // Get risk level config
  const getRiskConfig = (risk?: string) => {
    switch (risk) {
      case 'high':
        return { label: 'High Risk', color: 'bg-red-500' };
      case 'medium':
        return { label: 'Medium Risk', color: 'bg-yellow-500' };
      case 'low':
        return { label: 'Low Risk', color: 'bg-green-500' };
      default:
        return { label: 'Unknown Risk', color: 'bg-gray-500' };
    }
  };

  const riskConfig = getRiskConfig(data.riskLevel);

  return (
    <Card className="p-6 my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">ESG Compliance Status</h3>
          {data.lastAssessment && (
            <p className="text-sm text-muted-foreground">
              Last assessed: {data.lastAssessment}
            </p>
          )}
        </div>
        <Badge variant={riskConfig.color as any} className="ml-2">
          {riskConfig.label}
        </Badge>
      </div>

      {/* Overall Status */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border-2 mb-6 ${overallConfig.bgColor} ${overallConfig.borderColor}`}
      >
        <div className="flex items-center gap-3">
          <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
          <div>
            <div className="font-semibold text-lg">{overallConfig.label}</div>
            {data.overallScore !== undefined && (
              <div className="text-sm text-muted-foreground">
                Score: {data.overallScore}%
              </div>
            )}
          </div>
        </div>
        {data.overallScore !== undefined && (
          <div className="w-32">
            <Progress value={data.overallScore} className="h-2" />
          </div>
        )}
      </div>

      {/* Framework Details */}
      {data.frameworks && data.frameworks.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium">Framework Compliance</h4>
          {data.frameworks.map((framework, index) => {
            const config = getStatusConfig(framework.status);
            const Icon = config.icon;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{framework.framework}</div>
                    {framework.score !== undefined && (
                      <div className="mt-1">
                        <Progress value={framework.score} className="h-1.5 w-full max-w-[200px]" />
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps (if any framework has them) */}
      {data.frameworks?.some(f => f.gaps && f.gaps.length > 0) && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Identified Gaps
          </h4>
          <div className="space-y-2">
            {data.frameworks
              .filter(f => f.gaps && f.gaps.length > 0)
              .map((framework, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium mb-1">{framework.framework}:</div>
                  <ul className="space-y-1 ml-4">
                    {framework.gaps!.map((gap, gapIndex) => (
                      <li key={gapIndex} className="text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
