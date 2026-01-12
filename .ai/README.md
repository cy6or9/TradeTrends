# AI V2 System - Revenue Protection

This directory contains the AI memory system for TradeTrends. These files help AI assistants understand the business context, learn from past mistakes, and prevent revenue-breaking changes.

## Files

### business.json
Defines the primary business goal (affiliate revenue) and critical components that must never break. This file serves as the "constitution" for all AI decisions.

**Key concepts:**
- Primary goal is revenue, not just code quality
- Critical files that control revenue flow
- Deployment blocking conditions
- Monitoring endpoints

### known-good.json
Records validated configurations that are known to work correctly. Used as a reference point when troubleshooting issues.

**Contains:**
- Last known good commit SHA
- Validated redirect rules
- Function configurations
- Data file schemas
- Test result timestamps

### blocked-patterns.json
Lists code patterns that have caused failures in the past and should be blocked in future changes.

**Pattern types:**
- URL patterns (broken hrefs)
- Redirect configurations (missing force flags)
- Data validation (placeholder values)
- File-specific patterns

### history.json
Chronological log of incidents, their causes, and resolutions. Helps AI learn from past mistakes.

**Incident tracking:**
- Timestamp and severity
- Type of failure
- Affected files
- Root cause analysis
- Fix applied
- Prevention measures added

## Usage for AI Assistants

Before making ANY code changes:

1. **Read business.json** - Understand what must never break
2. **Check blocked-patterns.json** - Ensure changes don't match blocked patterns
3. **Verify against known-good.json** - Compare with validated configurations

After any failure:

1. **Record incident in history.json** - Document what happened
2. **Add blocking pattern** - Update blocked-patterns.json to prevent recurrence
3. **Update validation** - Add automated check to catch it earlier

## Example Workflow

```bash
# Before deployment
node scripts/validate.js  # Checks against blocked patterns
npm test                   # E2E tests verify revenue flow
node scripts/check-production.js  # Live production check

# After deployment
node scripts/check-production.js  # Verify production is healthy
```

## Monitoring

The production monitor should run:
- After every deployment (via GitHub Actions)
- On a cron schedule (every 15 minutes)
- When alerted by Netlify Functions monitoring

If ANY check fails → CRITICAL ALERT → potential revenue loss.
