import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import type { WorkflowConfig, WorkflowStep } from './types';

export interface RunStepResult {
  step: WorkflowStep;
  status: 'success' | 'failure' | 'cancelled';
  lastMessage?: string;
  error?: unknown;
}

export interface RunWorkflowOptions {
  verbose?: boolean;
}

export class WorkflowRunner {
  constructor(private config: WorkflowConfig) {}

  async run(options: RunWorkflowOptions = {}): Promise<RunStepResult[]> {
    const { steps } = this.config;
    const results: RunStepResult[] = [];

    for (const step of steps) {
      const result = await this.runStep(step, options.verbose ?? false);
      results.push(result);
      if (result.status === 'failure') {
        break;
      }
    }

    return results;
  }

  private async runStep(step: WorkflowStep, verbose: boolean): Promise<RunStepResult> {
    const { Codex } = await import('@openai/codex-sdk');
    const codex = new Codex();
    const thread = codex.startThread({
      sandboxMode: step.sandbox,
      workingDirectory: this.config.target ?? process.cwd(),
      skipGitRepoCheck: true
    });
    let lastMessage = '';

    if (verbose) {
      console.log(`\n=== Running step ${step.id} ===`);
      console.log(`Prompt:\n${step.prompt}\n`);
    }

    const processEvents = async () => {
      const { events } = await thread.runStreamed(step.prompt);

      for await (const event of events) {
        if (event.type === 'turn.failed') {
          throw new Error(event.error.message);
        }

        if (event.type === 'error') {
          throw new Error(event.message);
        }

        if (event.type === 'item.updated' || event.type === 'item.completed') {
          const item = event.item;
          if (item.type === 'agent_message') {
            lastMessage = item.text;
            if (verbose && event.type === 'item.completed') {
              console.log(`\n[${step.id}] Response:\n${item.text}\n`);
            }
          }

          if (verbose && item.type === 'todo_list') {
            console.log(
              `[${step.id}] Plan update: ${item.items
                .map((todo) => `${todo.completed ? '✓' : '•'} ${todo.text}`)
                .join(' | ')}`
            );
          }
        }

        if (event.type === 'item.started' && verbose && event.item.type === 'command_execution') {
          console.log(`[${step.id}] Running command: ${event.item.command}`);
        }

        if (event.type === 'item.completed' && event.item.type === 'command_execution' && verbose) {
          console.log(
            `[${step.id}] Command output (exit=${event.item.exit_code ?? 0}):\n${event.item.aggregated_output}\n`
          );
        }

        if (event.type === 'turn.completed') {
          return;
        }
      }
    };

    try {
      if (step.timeoutMs) {
        await withTimeout(processEvents(), step.timeoutMs, step.id);
      } else {
        await processEvents();
      }

      if (step.outputFile) {
        await mkdir(dirname(step.outputFile), { recursive: true });
        await writeFile(step.outputFile, lastMessage ?? '', 'utf8');
      }

      return { step, status: 'success', lastMessage };
    } catch (error) {
      return { step, status: 'failure', lastMessage, error };
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stepId: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Step "${stepId}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}
