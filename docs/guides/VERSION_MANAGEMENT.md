# Version Management Guide

This guide explains how to manage versions and releases in Blipee OS.

## Overview

Blipee OS uses [Semantic Versioning](https://semver.org/) (semver) with automated changelog generation and GitHub Actions for release management.

## Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, major feature releases (1.0.0 → 2.0.0)
- **MINOR**: New features, non-breaking changes (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, minor improvements (1.0.0 → 1.0.1)

## Release Process

### 1. Local Development

During development, follow conventional commit format:

```bash
# Feature additions
git commit -m "feat(dashboard): add real-time energy monitoring"
git commit -m "feat: implement voice input capabilities"

# Bug fixes
git commit -m "fix(ui): resolve hydration errors in production"
git commit -m "fix: escape apostrophes in dashboard component"

# Documentation
git commit -m "docs: update API documentation"
git commit -m "docs(readme): add live demo links"

# Maintenance
git commit -m "chore: update dependencies"
git commit -m "style: improve glass morphism design"
```

### 2. Automated Release (Recommended)

Use GitHub Actions for automated releases:

```bash
# Go to GitHub → Actions → Release Management → Run workflow
# Select version type: patch, minor, or major
```

This will:
1. Run tests and build checks
2. Bump version in package.json
3. Generate changelog entry from commits
4. Create git tag and GitHub release
5. Deploy to production

### 3. Manual Release

For manual releases:

```bash
# Update changelog
npm run changelog

# Bump version and create tag
npm run version:patch   # 1.0.0 → 1.0.1
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:major   # 1.0.0 → 2.0.0

# Or manually
npm version patch && git push && git push --tags
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or modifying tests
- **chore**: Maintenance tasks, dependency updates
- **perf**: Performance improvements
- **security**: Security improvements

### Scopes (Optional)

- **ui**: User interface changes
- **ai**: AI/ML related changes
- **dashboard**: Dashboard components
- **api**: API endpoints
- **auth**: Authentication
- **deploy**: Deployment related

### Examples

```bash
feat(ai): add proactive building insights
fix(dashboard): resolve energy chart rendering issue
docs(api): update chat endpoint documentation
style(ui): improve glass morphism effects
refactor(ai): optimize context engine performance
test(dashboard): add unit tests for metrics calculation
chore(deps): update Next.js to v14.2.5
perf(api): implement response caching
security(auth): add input validation
```

## Changelog Management

### Automatic Generation

The changelog is automatically updated using commit messages:

```bash
# Generate changelog entry for current version
npm run changelog

# This will:
# 1. Analyze commits since last release
# 2. Categorize changes by type
# 3. Generate formatted changelog entry
# 4. Prompt for additional release notes
```

### Manual Updates

You can manually edit `CHANGELOG.md` following the format:

```markdown
## [1.1.0] - 2025-01-15

### Added
- New voice input capabilities
- Real-time building dashboard

### Fixed
- Hydration errors in production
- Dashboard responsiveness issues

### Changed
- Improved AI conversation flow
- Enhanced glass morphism design
```

## Release Branches

### Main Branch Strategy

- **main**: Production-ready code, auto-deployed to Vercel
- All features merged via pull requests
- Only stable, tested code

### Feature Development

```bash
# Create feature branch
git checkout -b feature/voice-input
git push -u origin feature/voice-input

# Develop and commit with conventional messages
git commit -m "feat(voice): implement speech recognition"
git commit -m "feat(voice): add voice command processing"

# Create pull request to main
# After approval and merge, feature is auto-deployed
```

### Hotfix Process

```bash
# Create hotfix branch from main
git checkout -b hotfix/critical-bug
git push -u origin hotfix/critical-bug

# Fix and commit
git commit -m "fix: resolve critical dashboard crash"

# Create pull request with "hotfix" label
# After merge, create patch release
npm run version:patch
```

## Version Tags

### Tag Format

```bash
v1.0.0    # Major release
v1.1.0    # Minor release  
v1.1.1    # Patch release
```

### Creating Tags

```bash
# Automatic (recommended)
npm run version:minor

# Manual
git tag -a v1.1.0 -m "Release v1.1.0: Enhanced AI Capabilities"
git push origin v1.1.0
```

### Tag Messages

Include key highlights:

```bash
git tag -a v1.1.0 -m "Release v1.1.0: Enhanced AI Capabilities

- Added voice input with speech recognition
- Improved building dashboard with real-time metrics
- Enhanced AI conversation intelligence
- Fixed production deployment issues"
```

## GitHub Releases

### Automatic Release Notes

GitHub Actions automatically creates releases with:

- Changelog entry for the version
- Installation instructions
- Live demo links
- Documentation links

### Manual Release Creation

1. Go to GitHub → Releases → Draft a new release
2. Choose tag version (v1.1.0)
3. Release title: "Blipee OS v1.1.0"
4. Copy changelog entry to description
5. Add deployment and installation info

## NPM Scripts

### Version Management

```bash
npm run version:patch    # Bump patch version and push
npm run version:minor    # Bump minor version and push  
npm run version:major    # Bump major version and push
```

### Changelog

```bash
npm run changelog        # Interactive changelog update
```

### Release

```bash
npm run release         # Full release: build + lint + test + version
```

## Pre-release Process

### Development Versions

For pre-release versions:

```bash
npm version prerelease --preid=beta    # 1.0.0 → 1.0.1-beta.0
npm version prerelease --preid=alpha   # 1.0.0 → 1.0.1-alpha.0
```

### Beta Releases

```bash
# Create beta branch
git checkout -b release/v1.1.0-beta

# Bump to beta version
npm version prerelease --preid=beta

# Deploy to staging environment
# After testing, merge to main and create final release
```

## Deployment Integration

### Vercel Auto-Deploy

- **main** branch → Production (blipee-os.vercel.app)
- **develop** branch → Preview deployment
- Pull requests → Preview deployments

### Release Deployment

1. Tag creation triggers GitHub Action
2. GitHub Action creates release
3. Vercel automatically deploys tagged version
4. Production URL updated with new version

## Monitoring Releases

### Version Tracking

Check current deployed version:

```bash
# In browser console on blipee-os.vercel.app
console.log(window.__BLIPEE_VERSION__)

# Or check package.json
node -p "require('./package.json').version"
```

### Release Health

Monitor after releases:

- **Performance**: Response times, bundle sizes
- **Errors**: Sentry/console errors, crash rates
- **User Experience**: Conversion rates, session duration
- **Features**: Feature adoption, user feedback

## Rollback Process

### Quick Rollback

```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Or rollback deployment in Vercel dashboard
```

### Emergency Rollback

1. Go to Vercel dashboard
2. Select previous successful deployment
3. Promote to production
4. Create hotfix for underlying issue

## Best Practices

### Before Release

- [ ] All tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Performance tested
- [ ] Manual testing complete

### Release Checklist

- [ ] Version bumped correctly
- [ ] Changelog updated
- [ ] Git tag created
- [ ] GitHub release published
- [ ] Production deployment verified
- [ ] Monitoring alerts configured

### After Release

- [ ] Verify production functionality
- [ ] Check error rates and performance
- [ ] Monitor user feedback
- [ ] Update documentation if needed
- [ ] Plan next iteration

---

## Troubleshooting

### Failed Release

```bash
# If release fails, cleanup:
git tag -d v1.1.0           # Delete local tag
git push origin :refs/tags/v1.1.0  # Delete remote tag

# Fix issues and retry
npm run version:minor
```

### Version Conflicts

```bash
# If version conflicts arise:
git fetch --tags
git reset --hard origin/main
npm install
npm run version:minor
```

### Deployment Issues

1. Check Vercel dashboard for build logs
2. Verify environment variables
3. Check for breaking changes
4. Rollback if necessary
5. Fix issues and redeploy

---

This version management system ensures reliable, trackable releases while maintaining high code quality and seamless deployments.