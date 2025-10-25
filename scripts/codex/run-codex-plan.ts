import { createClient } from '@openai/codex-sdk';

async function main() {
  const prompt =
    process.argv.slice(2).join(' ') ||
    'Review the repository and summarize outstanding autonomous agent follow-up tasks.';

  const client = await createClient({
    target: 'blipee-os',
    profile: 'blipee-os',
    plan: true,
    stream: true
  });

  const session = await client.start();

  session.on('planUpdated', (event) => {
    if (!event.plan.steps.length) return;
    console.log('\n🧭 Plan updated:');
    event.plan.steps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. [${step.status}] ${step.title ?? step.id}`);
    });
  });

  session.on('commandOutput', (event) => {
    const { output, command } = event;
    if (!output?.trim()) return;
    console.log(`\n$ ${command?.join(' ') ?? 'command'}\n${output}`);
  });

  session.on('stepCompleted', (event) => {
    console.log(`\n✅ Step completed: ${event.step.title ?? event.step.id}`);
  });

  session.on('stepFailed', (event) => {
    console.error(`\n❌ Step failed: ${event.step.title ?? event.step.id}`);
    if (event.error) {
      console.error('   Reason:', event.error.message ?? event.error);
    }
  });

  console.log('🚀 Starting Codex session with prompt:\n', prompt);
  await session.run(prompt);

  const result = await session.exited;
  console.log('\nCodex session complete with status:', result?.status ?? 'unknown');

  await session.kill();
  await client.close();
}

main().catch((error) => {
  console.error('Codex automation failed:', error);
  process.exitCode = 1;
});
