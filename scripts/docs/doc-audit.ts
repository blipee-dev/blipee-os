import { promises as fs } from 'fs';
import path from 'path';

interface Violation {
  file: string;
  pattern: string;
  line: number;
  snippet: string;
}

const DOC_DIRECTORIES = ['docs', 'README.md'];

const DEPRECATED_REFERENCES: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\/api\/ai\/chat\b/,
    message: 'Legacy chat endpoint (/api/ai/chat)',
  },
  {
    pattern: /chat\s+interface/i,
    message: 'Legacy chat UX wording (replace with sustainability intelligence workflows)',
  },
];

async function collectFiles(entry: string): Promise<string[]> {
  const stats = await fs.stat(entry);

  if (stats.isFile()) {
    return [entry];
  }

  const entries = await fs.readdir(entry);
  const files = await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(entry, name);
      const fullStats = await fs.stat(fullPath);

      if (fullStats.isDirectory()) {
        if (
          name === 'node_modules' ||
          name.startsWith('.') ||
          name === 'archive'
        ) {
          return [];
        }
        return collectFiles(fullPath);
      }

      if (/\.(md|mdx|txt)$/i.test(name)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

async function scanFile(file: string): Promise<Violation[]> {
  const content = await fs.readFile(file, 'utf8');
  const violations: Violation[] = [];

  const lines = content.split(/\r?\n/);

  DEPRECATED_REFERENCES.forEach(({ pattern, message }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        violations.push({
          file,
          pattern: message,
          line: index + 1,
          snippet: line.trim().slice(0, 160),
        });
      }
    });
  });

  return violations;
}

async function run() {
  const roots = DOC_DIRECTORIES.map((entry) => path.resolve(process.cwd(), entry));
  const files = (
    await Promise.all(
      roots.flatMap(async (entry) => {
        try {
          return await collectFiles(entry);
        } catch (error) {
          // Ignore missing paths such as README.md if it does not exist.
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error(`Failed to read ${entry}:`, error);
          }
          return [];
        }
      }),
    )
  ).flat();

  const violations = (
    await Promise.all(
      files.map(async (file) => {
        try {
          return await scanFile(file);
        } catch (error) {
          console.error(`Failed to scan ${file}:`, error);
          return [];
        }
      }),
    )
  ).flat();

  if (violations.length === 0) {
    console.log('✅ Documentation audit passed. No deprecated references found.');
    return;
  }

  console.error('❌ Documentation audit failed. Update or archive the following references:');
  violations.forEach(({ file, pattern, line, snippet }) => {
    console.error(`- ${file}:${line} → ${pattern}`);
    console.error(`    ${snippet}`);
  });

  process.exitCode = 1;
}

run().catch((error) => {
  console.error('Unexpected error during documentation audit:', error);
  process.exitCode = 1;
});
