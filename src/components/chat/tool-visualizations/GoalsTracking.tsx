'use client';

/**
 * Goals Tracking Visualization Component
 *
 * Displays sustainability goals with:
 * - Progress indicators
 * - Timeline tracking
 * - Status badges
 * - Achievement milestones
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle, Target, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'missed';
  category?: string;
  progress?: number;
}

interface GoalsTrackingData {
  goals: Goal[];
  overallProgress?: number;
  achievedCount?: number;
  totalCount?: number;
}

interface GoalsTrackingProps {
  data: GoalsTrackingData;
}

export function GoalsTracking({ data }: GoalsTrackingProps) {
  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'achieved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Achieved',
          variant: 'default' as const
        };
      case 'on_track':
        return {
          icon: Target,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'On Track',
          variant: 'default' as const
        };
      case 'at_risk':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'At Risk',
          variant: 'secondary' as const
        };
      case 'behind':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          label: 'Behind',
          variant: 'destructive' as const
        };
      case 'missed':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Missed',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: Target,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: 'Unknown',
          variant: 'outline' as const
        };
    }
  };

  // Calculate progress
  const calculateProgress = (goal: Goal) => {
    if (goal.progress !== undefined) return goal.progress;
    if (goal.targetValue === 0) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="p-6 my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Sustainability Goals</h3>
          <p className="text-sm text-muted-foreground">
            Track progress towards your sustainability targets
          </p>
        </div>
        {data.achievedCount !== undefined && data.totalCount !== undefined && (
          <Badge className="bg-blue-500">
            {data.achievedCount} / {data.totalCount} Achieved
          </Badge>
        )}
      </div>

      {/* Overall Progress */}
      {data.overallProgress !== undefined && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Overall Progress</div>
            <div className="text-2xl font-bold">{data.overallProgress.toFixed(0)}%</div>
          </div>
          <Progress value={data.overallProgress} className="h-2" />
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {data.goals.map((goal) => {
          const statusConfig = getStatusConfig(goal.status);
          const StatusIcon = statusConfig.icon;
          const progress = calculateProgress(goal);

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border-2 ${statusConfig.bgColor} border-transparent hover:border-gray-200 transition-colors`}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{goal.name}</h4>
                    {goal.category && (
                      <Badge variant="outline" className="text-xs">
                        {goal.category}
                      </Badge>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  )}
                </div>
                <Badge variant={statusConfig.variant} className="ml-2">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{progress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-2"
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Current</div>
                  <div className="font-semibold">
                    {formatNumber(goal.currentValue)} {goal.unit}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Target</div>
                  <div className="font-semibold">
                    {formatNumber(goal.targetValue)} {goal.unit}
                  </div>
                </div>
              </div>

              {/* Deadline */}
              {goal.deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Target date: {formatDate(goal.deadline)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {data.goals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No goals found. Set sustainability targets to track progress.</p>
        </div>
      )}
    </Card>
  );
}
