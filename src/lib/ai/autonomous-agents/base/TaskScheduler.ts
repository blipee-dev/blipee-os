/**
 * TaskScheduler - Advanced Background Task Processing
 * 
 * Manages task queues, scheduling, and execution for autonomous agents.
 * Supports priority queues, delayed execution, and intelligent load balancing.
 * 
 * This is revolutionary infrastructure for autonomous AI employees.
 */

import { Task, TaskResult } from './AutonomousAgent';
import { createClient } from '../utils/supabase-stub';

export interface ScheduledTask extends Task {
  executionAttempts: number;
  nextExecution?: Date;
  intervalMs?: number; // For recurring tasks
  isRecurring?: boolean;
  dependencies?: string[]; // Task IDs that must complete first
  timeout?: number; // Task timeout in milliseconds
}

export interface TaskQueue {
  critical: ScheduledTask[];
  high: ScheduledTask[];
  medium: ScheduledTask[];
  low: ScheduledTask[];
}

export interface TaskExecution {
  taskId: string;
  agentName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  result?: TaskResult;
  error?: string;
}

export class TaskScheduler {
  private queues: TaskQueue = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };
  
  private isRunning: boolean = false;
  private processingTasks: Map<string, TaskExecution> = new Map();
  private taskHistory: TaskExecution[] = [];
  private maxConcurrentTasks: number = 5;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 5000; // 5 seconds
  
  private processingInterval?: NodeJS.Timeout;
  private taskProcessor?: (task: Task) => Promise<TaskResult>;
  
  private readonly supabase = createClient();

  /**
   * Start the task scheduler
   */
  start(taskProcessor: (task: Task) => Promise<TaskResult>): void {
    if (this.isRunning) return;
    
    this.taskProcessor = taskProcessor;
    this.isRunning = true;
    
    console.log('🚀 TaskScheduler starting...');
    
    // Start main processing loop
    this.processingInterval = setInterval(() => {
      this.processTaskQueues();
    }, 1000); // Check every second
    
    // Load persisted tasks from database
    this.loadPersistedTasks();
    
    console.log('✅ TaskScheduler is now active');
  }

  /**
   * Stop the task scheduler
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('⏹️ TaskScheduler stopping...');
    
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    // Cancel running tasks
    this.processingTasks.forEach(execution => {
      execution.status = 'cancelled';
      execution.endTime = new Date();
    });
    
    console.log('✅ TaskScheduler stopped');
  }

  /**
   * Schedule a task for execution
   */
  async scheduleTask(task: Task): Promise<void> {
    const scheduledTask: ScheduledTask = {
      ...task,
      executionAttempts: 0,
      nextExecution: task.scheduledFor || new Date()
    };
    
    // Add to appropriate priority queue
    const queue = this.queues[task.priority];
    queue.push(scheduledTask);
    
    // Sort by scheduled time (earliest first)
    queue.sort((a, b) => {
      const aTime = a.nextExecution?.getTime() || 0;
      const bTime = b.nextExecution?.getTime() || 0;
      return aTime - bTime;
    });
    
    // Persist to database for durability
    await this.persistTask(scheduledTask);
    
    console.log(`📋 Task ${task.id} scheduled with priority: ${task.priority}`);
  }

  /**
   * Schedule a recurring task
   */
  async scheduleRecurringTask(
    task: Omit<Task, 'id' | 'createdAt'>,
    intervalMs: number
  ): Promise<string> {
    const fullTask: Task = {
      ...task,
      id: `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    const scheduledTask: ScheduledTask = {
      ...fullTask,
      executionAttempts: 0,
      nextExecution: fullTask.scheduledFor || new Date(),
      intervalMs,
      isRecurring: true
    };
    
    await this.scheduleTask(scheduledTask);
    return fullTask.id;
  }

  /**
   * Cancel a scheduled task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    // Remove from queues
    let found = false;
    Object.values(this.queues).forEach(queue => {
      const index = queue.findIndex(t => t.id === taskId);
      if (index >= 0) {
        queue.splice(index, 1);
        found = true;
      }
    });
    
    // Cancel running task if exists
    const runningTask = this.processingTasks.get(taskId);
    if (runningTask) {
      runningTask.status = 'cancelled';
      runningTask.endTime = new Date();
      this.processingTasks.delete(taskId);
      found = true;
    }
    
    // Remove from database
    if (found) {
      await this.removePersistedTask(taskId);
    }
    
    return found;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): {
    status: 'queued' | 'running' | 'completed' | 'failed' | 'not_found';
    execution?: TaskExecution;
    queuePosition?: number;
  } {
    // Check running tasks
    const runningTask = this.processingTasks.get(taskId);
    if (runningTask) {
      return {
        status: 'running',
        execution: runningTask
      };
    }
    
    // Check task history
    const completedTask = this.taskHistory.find(t => t.taskId === taskId);
    if (completedTask) {
      return {
        status: completedTask.status === 'completed' ? 'completed' : 'failed',
        execution: completedTask
      };
    }
    
    // Check queues
    for (const [priority, queue] of Object.entries(this.queues)) {
      const position = queue.findIndex(t => t.id === taskId);
      if (position >= 0) {
        return {
          status: 'queued',
          queuePosition: position + 1
        };
      }
    }
    
    return { status: 'not_found' };
  }

  /**
   * Get scheduler statistics
   */
  getStats(): {
    isRunning: boolean;
    queueSizes: Record<string, number>;
    runningTasks: number;
    completedToday: number;
    failedToday: number;
    averageExecutionTime: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = this.taskHistory.filter(t => 
      t.startTime >= today
    );
    
    const completedToday = todayTasks.filter(t => t.status === 'completed').length;
    const failedToday = todayTasks.filter(t => t.status === 'failed').length;
    
    const executionTimes = todayTasks
      .filter(t => t.endTime)
      .map(t => t.endTime!.getTime() - t.startTime.getTime());
    
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;
    
    return {
      isRunning: this.isRunning,
      queueSizes: {
        critical: this.queues.critical.length,
        high: this.queues.high.length,
        medium: this.queues.medium.length,
        low: this.queues.low.length
      },
      runningTasks: this.processingTasks.size,
      completedToday,
      failedToday,
      averageExecutionTime
    };
  }

  /**
   * Main processing loop - executes tasks from queues
   */
  private async processTaskQueues(): Promise<void> {
    if (!this.isRunning || !this.taskProcessor) return;
    
    // Don't exceed max concurrent tasks
    if (this.processingTasks.size >= this.maxConcurrentTasks) return;
    
    // Process queues by priority (critical → high → medium → low)
    const priorities: (keyof TaskQueue)[] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const queue = this.queues[priority];
      
      while (queue.length > 0 && this.processingTasks.size < this.maxConcurrentTasks) {
        const task = queue[0];
        
        // Check if task is ready for execution
        if (!this.isTaskReadyForExecution(task)) {
          break; // Skip this priority level, tasks are sorted by time
        }
        
        // Remove from queue and execute
        queue.shift();
        await this.executeTask(task);
      }
    }
  }

  /**
   * Check if task is ready for execution
   */
  private isTaskReadyForExecution(task: ScheduledTask): boolean {
    const now = new Date();
    
    // Check scheduled time
    if (task.nextExecution && task.nextExecution > now) {
      return false;
    }
    
    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const hasUncompletedDependencies = task.dependencies.some(depId => {
        const depStatus = this.getTaskStatus(depId);
        return depStatus.status !== 'completed';
      });
      
      if (hasUncompletedDependencies) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    const execution: TaskExecution = {
      taskId: task.id,
      agentName: 'TaskScheduler',
      startTime: new Date(),
      status: 'running'
    };
    
    this.processingTasks.set(task.id, execution);
    
    console.log(`🔥 Executing task ${task.id} (${task.type})`);
    
    try {
      // Set timeout if specified
      let timeoutHandle: NodeJS.Timeout | undefined;
      const taskPromise = this.taskProcessor!(task);
      
      const result = await (task.timeout
        ? Promise.race([
            taskPromise,
            new Promise<TaskResult>((_, reject) => {
              timeoutHandle = setTimeout(() => {
                reject(new Error(`Task timeout after ${task.timeout}ms`));
              }, task.timeout);
            })
          ])
        : taskPromise);
      
      if (timeoutHandle) clearTimeout(timeoutHandle);
      
      // Task completed successfully
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.result = result;
      
      console.log(`✅ Task ${task.id} completed successfully`);
      
      // Handle recurring task
      if (task.isRecurring && task.intervalMs) {
        const nextTask: ScheduledTask = {
          ...task,
          executionAttempts: 0,
          nextExecution: new Date(Date.now() + task.intervalMs)
        };
        await this.scheduleTask(nextTask);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      execution.status = errorMessage.includes('timeout') ? 'timeout' : 'failed';
      execution.endTime = new Date();
      execution.error = errorMessage;
      
      console.error(`❌ Task ${task.id} failed:`, errorMessage);
      
      // Handle retries
      if (task.executionAttempts < this.maxRetries && execution.status === 'failed') {
        const retryDelay = this.calculateRetryDelay(task.executionAttempts);
        const retryTask: ScheduledTask = {
          ...task,
          executionAttempts: task.executionAttempts + 1,
          nextExecution: new Date(Date.now() + retryDelay)
        };
        
        console.log(`🔄 Scheduling retry ${task.executionAttempts + 1}/${this.maxRetries} for task ${task.id} in ${retryDelay}ms`);
        await this.scheduleTask(retryTask);
      }
    }
    
    // Move to history and remove from processing
    this.processingTasks.delete(task.id);
    this.taskHistory.unshift(execution);
    
    // Keep history to reasonable size (last 1000 executions)
    if (this.taskHistory.length > 1000) {
      this.taskHistory = this.taskHistory.slice(0, 1000);
    }
    
    // Update database
    await this.updateTaskExecution(execution);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.baseRetryDelay * Math.pow(2, attempt);
  }

  /**
   * Persist task to database for durability
   */
  private async persistTask(task: ScheduledTask): Promise<void> {
    try {
      await this.supabase
        .from('agent_tasks')
        .upsert({
          id: task.id,
          type: task.type,
          priority: task.priority,
          payload: task.payload,
          scheduled_for: task.scheduledFor?.toISOString(),
          created_at: task.createdAt.toISOString(),
          created_by: task.createdBy,
          context: task.context,
          execution_attempts: task.executionAttempts,
          next_execution: task.nextExecution?.toISOString(),
          interval_ms: task.intervalMs,
          is_recurring: task.isRecurring || false,
          dependencies: task.dependencies || [],
          timeout_ms: task.timeout,
          status: 'queued'
        });
    } catch (error) {
      console.error('Failed to persist task:', error);
    }
  }

  /**
   * Remove persisted task from database
   */
  private async removePersistedTask(taskId: string): Promise<void> {
    try {
      await this.supabase
        .from('agent_tasks')
        .delete()
        .eq('id', taskId);
    } catch (error) {
      console.error('Failed to remove persisted task:', error);
    }
  }

  /**
   * Load persisted tasks from database on startup
   */
  private async loadPersistedTasks(): Promise<void> {
    try {
      const { data: tasks, error } = await this.supabase
        .from('agent_tasks')
        .select('*')
        .in('status', ['queued', 'running'])
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      if (tasks && tasks.length > 0) {
        console.log(`📚 Loading ${tasks.length} persisted tasks`);
        
        for (const taskData of tasks) {
          const scheduledTask: ScheduledTask = {
            id: taskData.id,
            type: taskData.type,
            priority: taskData.priority,
            payload: taskData.payload,
            scheduledFor: taskData.scheduled_for ? new Date(taskData.scheduled_for) : undefined,
            createdAt: new Date(taskData.created_at),
            createdBy: taskData.created_by,
            context: taskData.context,
            executionAttempts: taskData.execution_attempts || 0,
            nextExecution: taskData.next_execution ? new Date(taskData.next_execution) : new Date(),
            intervalMs: taskData.interval_ms,
            isRecurring: taskData.is_recurring,
            dependencies: taskData.dependencies || [],
            timeout: taskData.timeout_ms
          };
          
          // Add to appropriate queue
          this.queues[scheduledTask.priority].push(scheduledTask);
        }
        
        // Sort all queues
        Object.values(this.queues).forEach(queue => {
          queue.sort((a, b) => {
            const aTime = a.nextExecution?.getTime() || 0;
            const bTime = b.nextExecution?.getTime() || 0;
            return aTime - bTime;
          });
        });
      }
    } catch (error) {
      console.error('Failed to load persisted tasks:', error);
    }
  }

  /**
   * Update task execution in database
   */
  private async updateTaskExecution(execution: TaskExecution): Promise<void> {
    try {
      await this.supabase
        .from('agent_task_executions')
        .insert({
          task_id: execution.taskId,
          agent_name: execution.agentName,
          start_time: execution.startTime.toISOString(),
          end_time: execution.endTime?.toISOString(),
          status: execution.status,
          result: execution.result,
          error: execution.error
        });
      
      // Update task status
      await this.supabase
        .from('agent_tasks')
        .update({ status: execution.status })
        .eq('id', execution.taskId);
        
    } catch (error) {
      console.error('Failed to update task execution:', error);
    }
  }

  /**
   * Clear completed tasks from queues (cleanup)
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean up task history
    this.taskHistory = this.taskHistory.filter(t => t.startTime >= cutoffDate);
    
    // Clean up database
    try {
      await this.supabase
        .from('agent_task_executions')
        .delete()
        .lt('start_time', cutoffDate.toISOString());
        
      await this.supabase
        .from('agent_tasks')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('created_at', cutoffDate.toISOString());
        
    } catch (error) {
      console.error('Failed to cleanup old tasks:', error);
    }
  }
}