'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  PlayCircle,
  Pause,
  Lightbulb,
  FlaskConical,
  Brain,
  Server,
  ThumbsUp,
  ThumbsDown,
  BarChart2,
} from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

interface WorkerStatus {
  workers: any[];
  railwayHealth: {
    status: string;
    uptime: number;
    instanceId: string;
    jobsCompleted: number;
    jobsFailed: number;
    isRunning: boolean;
    timestamp: string;
  } | null;
  railwayUrl: string | null;
  timestamp: string;
}

interface Job {
  id: string;
  job_type: string;
  job_name: string;
  status: string;
  schedule_type: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: any;
}

interface Experiment {
  id: string;
  experiment_name: string;
  status: string;
  control_prompt_id: string;
  variant_prompt_id: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  statistical_significance?: number;
  winner_variant?: string;
}

interface Insight {
  id: string;
  pattern_type: string;
  severity_score: number;
  description: string;
  affected_conversation_ids: string[];
  suggested_improvements: string[];
  created_at: string;
}

interface PromptVersion {
  id: string;
  version_number: number;
  status: string;
  content_hash: string;
  created_at: string;
  metadata: {
    feedback_metrics?: {
      total: number;
      positive: number;
      negative: number;
      satisfaction_rate: number;
    };
    last_feedback_at?: string;
  };
}

export default function AIPromptsClient() {
  useAuthRedirect('/settings/ai-prompts');

  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<any>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentStats, setExperimentStats] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'jobs' | 'experiments' | 'insights' | 'feedback'>('overview');

  const fetchData = async () => {
    try {
      const [workerRes, jobsRes, experimentsRes, insightsRes, versionsRes] = await Promise.all([
        fetch('/api/ai-prompt-optimization/worker-status'),
        fetch('/api/ai-prompt-optimization/jobs?limit=20'),
        fetch('/api/ai-prompt-optimization/experiments?limit=10'),
        fetch('/api/ai-prompt-optimization/insights?limit=10'),
        fetch('/api/ai-prompt-optimization/prompt-versions?limit=50'),
      ]);

      if (workerRes.ok) {
        const data = await workerRes.json();
        setWorkerStatus(data);
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs);
        setJobStats(data.stats);
      }

      if (experimentsRes.ok) {
        const data = await experimentsRes.json();
        setExperiments(data.experiments);
        setExperimentStats(data.stats);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.insights);
      }

      if (versionsRes.ok) {
        const data = await versionsRes.json();
        setPromptVersions(data.versions);
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerJob = async (jobType: string, jobName: string, config: any = {}) => {
    try {
      const response = await fetch('/api/ai-prompt-optimization/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: jobType, job_name: jobName, config }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      alert('Failed to trigger job');
      console.error('Trigger error:', err);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'failed':
      case 'unhealthy':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return <Activity className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading AI Prompt Optimization System...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Prompt Optimization</h1>
            <p className="text-gray-400">
              ML-powered autonomous system for improving AI prompts through pattern analysis and A/B testing
            </p>
          </div>
          <div className="flex gap-4">
            <GradientButton onClick={fetchData} className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Refresh
            </GradientButton>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Railway Worker Status */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Railway Worker Status</h2>
              {workerStatus?.railwayHealth && (
                <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(workerStatus.railwayHealth.status)}`}>
                  {getStatusIcon(workerStatus.railwayHealth.status)}
                  {workerStatus.railwayHealth.status}
                </span>
              )}
            </div>

            {workerStatus?.railwayHealth ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatUptime(workerStatus.railwayHealth.uptime)}
                  </div>
                  <div className="text-gray-400 text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {workerStatus.railwayHealth.jobsCompleted}
                  </div>
                  <div className="text-gray-400 text-sm">Jobs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {workerStatus.railwayHealth.jobsFailed}
                  </div>
                  <div className="text-gray-400 text-sm">Jobs Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {workerStatus.railwayHealth.instanceId.substring(0, 8)}...
                  </div>
                  <div className="text-gray-400 text-sm">Instance ID</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-yellow-400 mb-2">Worker not deployed yet</div>
                <div className="text-gray-400 text-sm">
                  Deploy to Railway to enable autonomous prompt optimization
                </div>
                {workerStatus?.railwayUrl && (
                  <div className="mt-2 text-gray-500 text-xs">
                    Expected URL: {workerStatus.railwayUrl}
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {(['overview', 'jobs', 'experiments', 'insights', 'feedback'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedTab === tab
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-medium text-white">Optimization Jobs</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white">{jobStats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Running</span>
                    <span className="text-green-400">{jobStats?.byStatus.running || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pending</span>
                    <span className="text-blue-400">{jobStats?.byStatus.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-gray-400">{jobStats?.byStatus.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Failed</span>
                    <span className="text-red-400">{jobStats?.byStatus.failed || 0}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FlaskConical className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">A/B Experiments</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active</span>
                    <span className="text-green-400">{experimentStats?.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-gray-400">{experimentStats?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white">{experiments.length || 0}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-medium text-white">AI Insights</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Discovered</span>
                    <span className="text-white">{insights.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">High Severity</span>
                    <span className="text-red-400">
                      {insights.filter((i) => i.severity_score >= 8).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Medium Severity</span>
                    <span className="text-yellow-400">
                      {insights.filter((i) => i.severity_score >= 5 && i.severity_score < 8).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Quick Actions */}
        {selectedTab === 'overview' && (
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => triggerJob('pattern_analysis', 'Manual Pattern Analysis', { daysToAnalyze: 7 })}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    <div className="text-white font-medium">Analyze Patterns</div>
                  </div>
                  <div className="text-gray-400 text-sm">Scan conversations for issues and patterns</div>
                </button>

                <button
                  onClick={() => triggerJob('variant_generation', 'Manual Variant Generation', {})}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div className="text-white font-medium">Generate Variants</div>
                  </div>
                  <div className="text-gray-400 text-sm">Create improved prompt variations</div>
                </button>

                <button
                  onClick={() => triggerJob('full_optimization_cycle', 'Manual Full Cycle', {})}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <div className="text-white font-medium">Full Optimization</div>
                  </div>
                  <div className="text-gray-400 text-sm">Run complete optimization cycle</div>
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Jobs Tab */}
        {selectedTab === 'jobs' && (
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Jobs</h2>
              <div className="space-y-3">
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No jobs yet. Trigger a manual job to get started.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            {job.status}
                          </span>
                          <span className="text-white font-medium">{job.job_name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(job.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Type: <span className="text-gray-300">{job.job_type}</span>
                      </div>
                      {job.error_message && (
                        <div className="mt-2 text-red-400 text-sm">{job.error_message}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Experiments Tab */}
        {selectedTab === 'experiments' && (
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Active Experiments</h2>
              <div className="space-y-3">
                {experiments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No experiments running yet. Create an experiment to test prompt variants.
                  </div>
                ) : (
                  experiments.map((exp) => (
                    <div key={exp.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FlaskConical className="h-5 w-5 text-blue-400" />
                          <span className="text-white font-medium">{exp.experiment_name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(exp.status)}`}>
                            {exp.status}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(exp.created_at).toLocaleString()}
                        </span>
                      </div>
                      {exp.statistical_significance && (
                        <div className="text-gray-400 text-sm">
                          Significance: <span className="text-green-400">{exp.statistical_significance.toFixed(2)}%</span>
                        </div>
                      )}
                      {exp.winner_variant && (
                        <div className="text-gray-400 text-sm">
                          Winner: <span className="text-green-400">{exp.winner_variant}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Insights Tab */}
        {selectedTab === 'insights' && (
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">AI-Discovered Insights</h2>
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No insights discovered yet. Run pattern analysis to discover issues.
                  </div>
                ) : (
                  insights.map((insight) => (
                    <div key={insight.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Lightbulb className={`h-5 w-5 ${
                          insight.severity_score >= 8
                            ? 'text-red-400'
                            : insight.severity_score >= 5
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`} />
                        <span className="text-white font-medium capitalize">
                          {insight.pattern_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Severity: {insight.severity_score}/10
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm mb-2">{insight.description}</div>
                      {insight.suggested_improvements.length > 0 && (
                        <div className="mt-2">
                          <div className="text-gray-400 text-xs mb-1">Suggested Improvements:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {insight.suggested_improvements.map((improvement, idx) => (
                              <li key={idx} className="text-gray-300 text-sm">{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-gray-500 text-xs mt-2">
                        {new Date(insight.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Feedback Tab */}
        {selectedTab === 'feedback' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <GlassCard>
                <div className="p-4 text-center">
                  <BarChart2 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {promptVersions.length}
                  </div>
                  <div className="text-gray-400 text-sm">Prompt Versions</div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 text-center">
                  <ThumbsUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">
                    {promptVersions.reduce((sum, v) =>
                      sum + (v.metadata?.feedback_metrics?.positive || 0), 0
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">Positive Feedback</div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 text-center">
                  <ThumbsDown className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-400">
                    {promptVersions.reduce((sum, v) =>
                      sum + (v.metadata?.feedback_metrics?.negative || 0), 0
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">Negative Feedback</div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">
                    {(() => {
                      const versionsWithFeedback = promptVersions.filter(
                        v => (v.metadata?.feedback_metrics?.total || 0) > 0
                      );
                      if (versionsWithFeedback.length === 0) return '0%';
                      const avgSat = versionsWithFeedback.reduce(
                        (sum, v) => sum + (v.metadata?.feedback_metrics?.satisfaction_rate || 0),
                        0
                      ) / versionsWithFeedback.length;
                      return `${avgSat.toFixed(1)}%`;
                    })()}
                  </div>
                  <div className="text-gray-400 text-sm">Avg Satisfaction</div>
                </div>
              </GlassCard>
            </div>

            {/* Prompt Versions Table */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Prompt Versions Performance</h2>
                <div className="space-y-3">
                  {promptVersions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No prompt versions tracked yet. Versions will appear as users interact with the AI.
                    </div>
                  ) : (
                    promptVersions.map((version) => {
                      const metrics = version.metadata?.feedback_metrics || {
                        total: 0,
                        positive: 0,
                        negative: 0,
                        satisfaction_rate: 0
                      };

                      const hasEnoughFeedback = metrics.total >= 10;
                      const isHealthy = metrics.satisfaction_rate >= 60;

                      return (
                        <div
                          key={version.id}
                          className={`p-4 rounded-lg border transition-all ${
                            hasEnoughFeedback
                              ? isHealthy
                                ? 'bg-green-500/5 border-green-500/30'
                                : 'bg-red-500/5 border-red-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">
                                Version #{version.version_number}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(version.status)}`}>
                                {version.status}
                              </span>
                              <span className="text-gray-500 text-xs font-mono">
                                {version.content_hash}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {new Date(version.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Metrics */}
                          {metrics.total > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <div className="text-gray-400 text-xs mb-1">Total Feedback</div>
                                <div className="text-white font-semibold">{metrics.total}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-xs mb-1">Positive</div>
                                <div className="text-green-400 font-semibold flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {metrics.positive}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-xs mb-1">Negative</div>
                                <div className="text-red-400 font-semibold flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3" />
                                  {metrics.negative}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-xs mb-1">Satisfaction</div>
                                <div className={`font-semibold ${
                                  metrics.satisfaction_rate >= 80 ? 'text-green-400' :
                                  metrics.satisfaction_rate >= 60 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {metrics.satisfaction_rate.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">No feedback yet</div>
                          )}

                          {/* Warning for low satisfaction */}
                          {hasEnoughFeedback && !isHealthy && (
                            <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Low satisfaction rate - optimization recommended
                            </div>
                          )}

                          {/* Last feedback timestamp */}
                          {version.metadata?.last_feedback_at && (
                            <div className="mt-2 text-gray-500 text-xs">
                              Last feedback: {new Date(version.metadata.last_feedback_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
