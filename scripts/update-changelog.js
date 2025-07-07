#!/usr/bin/env node

/**
 * Automatic Changelog Update Script
 *
 * This script helps maintain the changelog by:
 * 1. Reading git commits since last release
 * 2. Categorizing changes by type (feat, fix, docs, etc.)
 * 3. Updating the changelog with new entries
 * 4. Providing interactive prompts for release notes
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// Changelog file path
const CHANGELOG_PATH = path.join(__dirname, "../CHANGELOG.md");

// Commit type mappings
const COMMIT_TYPES = {
  feat: "Added",
  fix: "Fixed",
  docs: "Documentation",
  style: "Changed",
  refactor: "Changed",
  test: "Testing",
  chore: "Maintenance",
  perf: "Performance",
  security: "Security",
};

// Get current version from package.json
function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"),
  );
  return packageJson.version;
}

// Get git commits since last tag
function getCommitsSinceLastRelease() {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
    }).trim();
    const commits = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, {
      encoding: "utf8",
    });
    return commits
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  } catch (error) {
    // No previous tags, get all commits
    const commits = execSync("git log --oneline --no-merges", {
      encoding: "utf8",
    });
    return commits
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  }
}

// Parse commit message
function parseCommit(commitLine) {
  const [hash, ...messageParts] = commitLine.split(" ");
  const message = messageParts.join(" ");

  // Parse conventional commit format: type(scope): description
  const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  if (conventionalMatch) {
    const [, type, scope, description] = conventionalMatch;
    return {
      hash: hash.substring(0, 7),
      type,
      scope,
      description,
      category: COMMIT_TYPES[type] || "Changed",
      rawMessage: message,
    };
  }

  // Fallback for non-conventional commits
  return {
    hash: hash.substring(0, 7),
    type: "other",
    scope: null,
    description: message,
    category: "Changed",
    rawMessage: message,
  };
}

// Group commits by category
function groupCommitsByCategory(commits) {
  const grouped = {};

  commits.forEach((commit) => {
    const parsed = parseCommit(commit);
    if (!grouped[parsed.category]) {
      grouped[parsed.category] = [];
    }
    grouped[parsed.category].push(parsed);
  });

  return grouped;
}

// Generate changelog entry
function generateChangelogEntry(version, groupedCommits, releaseNotes = "") {
  const date = new Date().toISOString().split("T")[0];
  let entry = `## [${version}] - ${date}\n\n`;

  if (releaseNotes) {
    entry += `${releaseNotes}\n\n`;
  }

  // Order categories
  const categoryOrder = [
    "Added",
    "Changed",
    "Deprecated",
    "Removed",
    "Fixed",
    "Security",
    "Performance",
    "Testing",
    "Documentation",
    "Maintenance",
  ];

  categoryOrder.forEach((category) => {
    if (groupedCommits[category] && groupedCommits[category].length > 0) {
      entry += `### ${category}\n`;
      groupedCommits[category].forEach((commit) => {
        const scopeStr = commit.scope ? ` (${commit.scope})` : "";
        entry += `- ${commit.description}${scopeStr}\n`;
      });
      entry += "\n";
    }
  });

  return entry;
}

// Update changelog file
function updateChangelog(newEntry) {
  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");

  // Find the position to insert new entry (after "## [Unreleased]" section)
  const unreleasedEndIndex = changelog.indexOf("\n## [");

  if (unreleasedEndIndex === -1) {
    // No previous releases, add after unreleased section
    const lines = changelog.split("\n");
    const unreleasedIndex = lines.findIndex((line) =>
      line.startsWith("## [Unreleased]"),
    );

    if (unreleasedIndex !== -1) {
      // Find the end of unreleased section
      let insertIndex = unreleasedIndex + 1;
      while (
        insertIndex < lines.length &&
        !lines[insertIndex].startsWith("## [")
      ) {
        insertIndex++;
      }
      lines.splice(insertIndex, 0, "", newEntry.trim());
      fs.writeFileSync(CHANGELOG_PATH, lines.join("\n"));
    } else {
      throw new Error("Could not find [Unreleased] section in changelog");
    }
  } else {
    const beforeNewEntry = changelog.substring(0, unreleasedEndIndex);
    const afterNewEntry = changelog.substring(unreleasedEndIndex);
    const updatedChangelog = beforeNewEntry + "\n\n" + newEntry + afterNewEntry;
    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog);
  }
}

// Interactive prompt for release notes
function promptForReleaseNotes() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n📝 Release Notes (optional):");
    console.log("Enter additional release notes or press Enter to skip:");

    rl.question("> ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main function
async function main() {
  try {
    console.log("🔄 Updating changelog...\n");

    const currentVersion = getCurrentVersion();
    console.log(`📦 Current version: ${currentVersion}`);

    const commits = getCommitsSinceLastRelease();

    if (commits.length === 0 || (commits.length === 1 && commits[0] === "")) {
      console.log("✅ No new commits found since last release.");
      return;
    }

    console.log(`📝 Found ${commits.length} commits since last release:`);
    commits.forEach((commit) => console.log(`  - ${commit}`));

    const groupedCommits = groupCommitsByCategory(commits);

    console.log("\n📋 Categorized changes:");
    Object.entries(groupedCommits).forEach(([category, commits]) => {
      console.log(`  ${category}: ${commits.length} changes`);
    });

    // Prompt for release notes
    const releaseNotes = await promptForReleaseNotes();

    const changelogEntry = generateChangelogEntry(
      currentVersion,
      groupedCommits,
      releaseNotes,
    );

    console.log("\n📄 Generated changelog entry:");
    console.log("─".repeat(50));
    console.log(changelogEntry);
    console.log("─".repeat(50));

    // Confirm before updating
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\n❓ Update changelog with this entry? (y/N): ", (answer) => {
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        updateChangelog(changelogEntry);
        console.log("✅ Changelog updated successfully!");

        // Suggest git commands
        console.log("\n💡 Suggested next steps:");
        console.log("git add CHANGELOG.md");
        console.log(
          `git commit -m "docs: update changelog for v${currentVersion}"`,
        );
        console.log(
          `git tag -a v${currentVersion} -m "Release v${currentVersion}"`,
        );
        console.log("git push && git push --tags");
      } else {
        console.log("❌ Changelog update cancelled.");
      }
      rl.close();
    });
  } catch (error) {
    console.error("❌ Error updating changelog:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  getCommitsSinceLastRelease,
  parseCommit,
  groupCommitsByCategory,
  generateChangelogEntry,
  updateChangelog,
};
