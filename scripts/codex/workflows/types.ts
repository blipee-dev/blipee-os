export interface WorkflowStep {
  id: string;
  prompt: string;
  sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access';
  approval?: 'untrusted' | 'on-request' | 'on-failure' | 'never';
  outputFile?: string;
  tags?: string[];
  timeoutMs?: number;
}

export interface WorkflowConfig {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  profile?: string;
  target?: string;
  plan?: boolean;
  stream?: boolean;
}
