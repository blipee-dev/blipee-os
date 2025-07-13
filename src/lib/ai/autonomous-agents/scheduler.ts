import { createClient } from '@supabase/supabase-js';
import { AgentTask } from './agent-framework';

export interface ScheduledTask {
  id: string;
  agentId: string;
  organizationId: string;
  taskType: string;
  schedulePattern: string; // cron pattern or interval
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  requiresApproval: boolean;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface TaskQueueItem {
  task: AgentTask;
  scheduledTime: Date;
  addedAt: Date;
}

export class TaskScheduler {
  private taskQueue: Map<string, TaskQueueItem[]> = new Map(); // agentId -> tasks
  private supabase: ReturnType<typeof createClient>;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_KEY']!
    );
  }
  
  // Initialize scheduler for an organization
  async initialize(organizationId: string): Promise<void> {
    // Load scheduled tasks from database
    const { data: tasks } = await this.supabase
      .from('agent_scheduled_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('enabled', true);
      
    if (!tasks || tasks.length === 0) return;
    
    // Schedule each task
    for (const task of Array.from(tasks) as any[]) {
      await this.scheduleTask({
        id: task.id,
        agentId: task.agent_id,
        organizationId: task.organization_id,
        taskType: task.task_type,
        schedulePattern: task.schedule_pattern,
        priority: task.priority,
        data: task.data,
        requiresApproval: task.requires_approval,
        enabled: task.enabled,
        lastRun: task.last_run ? new Date(task.last_run) : undefined,
        nextRun: task.next_run ? new Date(task.next_run) : undefined
      });
    }
    
    console.log(`📅 Initialized scheduler with ${tasks.length} tasks for org ${organizationId}`);
  }
  
  // Schedule a task
  async scheduleTask(scheduledTask: ScheduledTask): Promise<void> {
    const jobKey = `${scheduledTask.agentId}-${scheduledTask.id}`;
    
    // Clear existing schedule if any
    if (this.scheduledJobs.has(jobKey)) {
      clearTimeout(this.scheduledJobs.get(jobKey)!);
    }
    
    // Calculate next run time
    const nextRun = this.calculateNextRun(scheduledTask.schedulePattern, scheduledTask.lastRun);
    
    // Update database
    await this.supabase
      .from('agent_scheduled_tasks')
      .update({ next_run: nextRun.toISOString() })
      .eq('id', scheduledTask.id);
    
    // Schedule the task
    const delay = nextRun.getTime() - Date.now();
    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.executeScheduledTask(scheduledTask);
      }, delay);
      
      this.scheduledJobs.set(jobKey, timeout);
    }
  }
  
  // Execute a scheduled task
  private async executeScheduledTask(scheduledTask: ScheduledTask): Promise<void> {
    // Create agent task
    const agentTask: AgentTask = {
      id: `scheduled-${scheduledTask.id}-${Date.now()}`,
      type: scheduledTask.taskType,
      priority: scheduledTask.priority,
      data: scheduledTask.data,
      requiresApproval: scheduledTask.requiresApproval
    };
    
    // Add to queue
    this.addToQueue(scheduledTask.agentId, agentTask);
    
    // Update last run
    await this.supabase
      .from('agent_scheduled_tasks')
      .update({ last_run: new Date().toISOString() })
      .eq('id', scheduledTask.id);
    
    // Reschedule for next run
    await this.scheduleTask({
      ...scheduledTask,
      lastRun: new Date()
    });
  }
  
  // Add task to agent's queue
  addToQueue(agentId: string, task: AgentTask, scheduledTime?: Date): void {
    if (!this.taskQueue.has(agentId)) {
      this.taskQueue.set(agentId, []);
    }
    
    const queue = this.taskQueue.get(agentId)!;
    queue.push({
      task,
      scheduledTime: scheduledTime || new Date(),
      addedAt: new Date()
    });
    
    // Sort by priority and scheduled time
    queue.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.task.priority] - priorityOrder[b.task.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by scheduled time
      return a.scheduledTime.getTime() - b.scheduledTime.getTime();
    });
  }
  
  // Get next task for an agent
  async getNextTask(agentId: string): Promise<AgentTask | null> {
    const queue = this.taskQueue.get(agentId);
    if (!queue || queue.length === 0) return null;
    
    // Get the first task that's ready to run
    const now = new Date();
    const readyTaskIndex = queue.findIndex(item => 
      item.scheduledTime <= now
    );
    
    if (readyTaskIndex === -1) return null;
    
    // Remove and return the task
    const [item] = queue.splice(readyTaskIndex, 1);
    return item.task;
  }
  
  // Get all pending tasks for an agent
  getPendingTasks(agentId: string): AgentTask[] {
    const queue = this.taskQueue.get(agentId);
    if (!queue) return [];
    
    return queue.map(item => item.task);
  }
  
  // Calculate next run time based on schedule pattern
  private calculateNextRun(pattern: string, lastRun?: Date): Date {
    const now = new Date();
    const base = lastRun || now;
    
    // Handle interval patterns (e.g., "1h", "30m", "1d")
    const intervalMatch = pattern.match(/^(\d+)([mhd])$/);
    if (intervalMatch) {
      const [, amount, unit] = intervalMatch;
      const value = parseInt(amount);
      
      switch (unit) {
        case 'm': // minutes
          return new Date(base.getTime() + value * 60 * 1000);
        case 'h': // hours
          return new Date(base.getTime() + value * 60 * 60 * 1000);
        case 'd': // days
          return new Date(base.getTime() + value * 24 * 60 * 60 * 1000);
      }
    }
    
    // Handle cron patterns (simplified)
    if (pattern.includes(' ')) {
      return this.parseCronPattern(pattern, base);
    }
    
    // Default to 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  
  // Simple cron pattern parser
  private parseCronPattern(pattern: string, after: Date): Date {
    // Format: "minute hour day month dayOfWeek"
    // Example: "0 9 * * 1" = Every Monday at 9 AM
    const [minute, hour, day, month, dayOfWeek] = pattern.split(' ');
    
    const next = new Date(after);
    next.setSeconds(0);
    next.setMilliseconds(0);
    
    // Set minute
    if (minute !== '*') {
      next.setMinutes(parseInt(minute));
    }
    
    // Set hour
    if (hour !== '*') {
      next.setHours(parseInt(hour));
      if (next <= after) {
        next.setDate(next.getDate() + 1);
      }
    }
    
    // Set day of week
    if (dayOfWeek !== '*') {
      const targetDay = parseInt(dayOfWeek);
      const currentDay = next.getDay();
      const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysToAdd);
    }
    
    // Set day of month
    if (day !== '*') {
      next.setDate(parseInt(day));
      if (next <= after) {
        next.setMonth(next.getMonth() + 1);
      }
    }
    
    // Set month
    if (month !== '*') {
      next.setMonth(parseInt(month) - 1); // Months are 0-indexed
      if (next <= after) {
        next.setFullYear(next.getFullYear() + 1);
      }
    }
    
    return next;
  }
  
  // Create a new scheduled task
  async createScheduledTask(
    agentId: string,
    organizationId: string,
    taskConfig: {
      taskType: string;
      schedulePattern: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      data?: any;
      requiresApproval?: boolean;
    }
  ): Promise<ScheduledTask> {
    const task = {
      agent_id: agentId,
      organization_id: organizationId,
      task_type: taskConfig.taskType,
      schedule_pattern: taskConfig.schedulePattern,
      priority: taskConfig.priority || 'medium',
      data: taskConfig.data || {},
      requires_approval: taskConfig.requiresApproval || false,
      enabled: true
    };
    
    const { data, error } = await this.supabase
      .from('agent_scheduled_tasks')
      .insert(task)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create scheduled task: ${error?.message}`);
    }
    
    const scheduledTask: ScheduledTask = {
      id: data.id as string,
      agentId: data.agent_id as string,
      organizationId: data.organization_id as string,
      taskType: data.task_type as string,
      schedulePattern: data.schedule_pattern as string,
      priority: data.priority as 'low' | 'medium' | 'high' | 'critical',
      data: data.data,
      requiresApproval: data.requires_approval as boolean,
      enabled: data.enabled as boolean
    };
    
    // Schedule the task
    await this.scheduleTask(scheduledTask);
    
    return scheduledTask;
  }
  
  // Update scheduled task
  async updateScheduledTask(
    taskId: string,
    updates: Partial<ScheduledTask>
  ): Promise<void> {
    const { error: _error } = await this.supabase
      .from('agent_scheduled_tasks')
      .update({
        task_type: updates.taskType,
        schedule_pattern: updates.schedulePattern,
        priority: updates.priority,
        data: updates.data,
        requires_approval: updates.requiresApproval,
        enabled: updates.enabled
      })
      .eq('id', taskId);
      
    if (error) {
      throw new Error(`Failed to update scheduled task: ${error.message}`);
    }
    
    // Reschedule if needed
    if (updates.schedulePattern || updates.enabled !== undefined) {
      const { data: _data } = await this.supabase
        .from('agent_scheduled_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (data) {
        await this.scheduleTask({
          id: data.id as string,
          agentId: data.agent_id as string,
          organizationId: data.organization_id as string,
          taskType: data.task_type as string,
          schedulePattern: data.schedule_pattern as string,
          priority: data.priority as 'low' | 'medium' | 'high' | 'critical',
          data: data.data,
          requiresApproval: data.requires_approval as boolean,
          enabled: data.enabled as boolean,
          lastRun: data.last_run ? new Date(data.last_run as string) : undefined,
          nextRun: data.next_run ? new Date(data.next_run as string) : undefined
        });
      }
    }
  }
  
  // Delete scheduled task
  async deleteScheduledTask(taskId: string): Promise<void> {
    const { error: _error } = await this.supabase
      .from('agent_scheduled_tasks')
      .delete()
      .eq('id', taskId);
      
    if (error) {
      throw new Error(`Failed to delete scheduled task: ${error.message}`);
    }
    
    // Clear any scheduled jobs
    for (const [key, timeout] of Array.from(this.scheduledJobs.entries())) {
      if (key.includes(taskId)) {
        clearTimeout(timeout);
        this.scheduledJobs.delete(key);
      }
    }
  }
  
  // Get task statistics
  async getTaskStats(agentId: string, organizationId: string): Promise<{
    totalScheduled: number;
    completedToday: number;
    pendingTasks: number;
    averageExecutionTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get scheduled tasks count
    const { count: totalScheduled } = await this.supabase
      .from('agent_scheduled_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .eq('enabled', true);
      
    // Get completed tasks today
    const { count: completedToday } = await this.supabase
      .from('agent_results')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .gte('created_at', today.toISOString());
      
    // Get average execution time
    const { data: results } = await this.supabase
      .from('agent_results')
      .select('execution_time_ms')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .not('execution_time_ms', 'is', null)
      .limit(100);
      
    const averageExecutionTime = results && results.length > 0
      ? results.reduce((sum, r) => sum + (r.execution_time_ms as number), 0) / results.length
      : 0;
      
    return {
      totalScheduled: totalScheduled || 0,
      completedToday: completedToday || 0,
      pendingTasks: this.getPendingTasks(agentId).length,
      averageExecutionTime
    };
  }
  
  // Shutdown scheduler
  shutdown(): void {
    // Clear all scheduled jobs
    for (const timeout of Array.from(this.scheduledJobs.values())) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();
    this.taskQueue.clear();
    
    console.log('📅 Task scheduler shut down');
  }
}