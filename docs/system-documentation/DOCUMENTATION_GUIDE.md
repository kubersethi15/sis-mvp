# Documentation Maintenance Guide

## How System Documentation is Organized

```
docs/system-documentation/
├── SYSTEM_AS_IS_MASTER.md      ← Technical reference (update every session)
├── AI_HANDOFF_CONTEXT.md       ← For AI context transfer (update when architecture changes)
├── PLATFORM_OVERVIEW.md        ← For stakeholders (update at milestones)
├── HIGH_LEVEL_SYSTEM_SUMMARY.md← For non-technical humans (update at milestones)
├── PROCESS_FLOWS.md            ← Mermaid diagrams (update when flows change)
├── ROADMAP_AND_RECOMMENDATIONS.md ← Roadmap + gaps (update every session)
└── DOCUMENTATION_GUIDE.md      ← This file
```

## Update Rules

### Every build session
Update these two files:
1. **SYSTEM_AS_IS_MASTER.md** — add new modules to Section D (Functional Architecture), update Section O (Build Status), update Section P (Known Gaps) if gaps are closed
2. **ROADMAP_AND_RECOMMENDATIONS.md** — move completed items, add new recommendations

### When architecture changes
Update:
- **AI_HANDOFF_CONTEXT.md** — new entities, workflows, terminology
- **PROCESS_FLOWS.md** — if a flow changed or new flow added

### At milestones (employer pilot, psychologist pilot, production launch)
Update:
- **PLATFORM_OVERVIEW.md** — maturity assessment, strengths, risks
- **HIGH_LEVEL_SYSTEM_SUMMARY.md** — current stage, roadmap themes

### When sharing with external parties
- **Funders/partners:** Share PLATFORM_OVERVIEW.md
- **New AI session:** Paste AI_HANDOFF_CONTEXT.md
- **Technical team:** Share SYSTEM_AS_IS_MASTER.md
- **Ryan/leadership:** Share HIGH_LEVEL_SYSTEM_SUMMARY.md or PLATFORM_OVERVIEW.md

## Quick Update Checklist

When a feature is built, check these boxes:

- [ ] Is the new module documented in SYSTEM_AS_IS_MASTER.md Section D?
- [ ] Are new API routes listed in Section M?
- [ ] Are new data entities listed in Section L?
- [ ] Is the build status updated in Section O?
- [ ] Are closed gaps removed from Section P?
- [ ] Is the roadmap updated in ROADMAP_AND_RECOMMENDATIONS.md?
- [ ] If a new flow was added, is it in PROCESS_FLOWS.md?

## Version History

| Date | Version | What Changed |
|---|---|---|
| April 14, 2026 | 1.0 | Initial documentation created from full codebase review |

*Update this table each time documentation is significantly revised.*
