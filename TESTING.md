# 🧪 Testing Guide - Software Developer Agent IDE

Complete guide for testing the IDE before and after deployment.

---

## 📋 Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Pre-Launch Testing](#pre-launch-testing)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [Automated Testing Setup](#automated-testing-setup)
5. [Performance Testing](#performance-testing)
6. [User Acceptance Testing](#user-acceptance-testing)
7. [Bug Reporting](#bug-reporting)

---

## 🎯 Testing Philosophy

### Our Approach:
- **Manual Testing First** - Verify core flows work
- **Automated Testing Second** - Prevent regressions
- **User Testing Third** - Validate UX
- **Continuous Improvement** - Iterate based on feedback

### Quality Standards:
- ✅ Zero critical bugs at launch
- ✅ All core features functional
- ✅ 95%+ uptime
- ✅ Fast performance (<2s load)
- ✅ Intuitive UX

---

## 🚀 Pre-Launch Testing

### Phase 1: Installation Testing

**Test on all platforms:**
- [ ] Windows 10
- [ ] Windows 11
- [ ] macOS Intel
- [ ] macOS Apple Silicon
- [ ] Ubuntu 20.04
- [ ] Ubuntu 22.04

**For each platform:**
1. [ ] Fresh OS installation
2. [ ] Install prerequisites (Node, Rust)
3. [ ] Clone project
4. [ ] Run `pnpm install`
5. [ ] Run `pnpm tauri dev`
6. [ ] Verify application launches
7. [ ] Document any issues

**Expected time:** 2-3 hours per platform

---

## ✅ Manual Testing Checklist

### 1. License & Welcome Flow

**Test Case 1.1: Skip License**
- [ ] Launch application
- [ ] See welcome screen
- [ ] Click "Skip for now"
- [ ] Enter dashboard
- [ ] ✅ PASS / ❌ FAIL

**Test Case 1.2: License Activation**
- [ ] Enter valid license key
- [ ] Paste certificate
- [ ] Click "Activate"
- [ ] See success message
- [ ] Enter dashboard
- [ ] ✅ PASS / ❌ FAIL

**Test Case 1.3: Invalid License**
- [ ] Enter invalid key
- [ ] See error message
- [ ] Error is clear and helpful
- [ ] ✅ PASS / ❌ FAIL

---

### 2. Project Management

**Test Case 2.1: Create Project**
- [ ] Click "New Project"
- [ ] Enter project name: "test-app"
- [ ] Select type: Full-Stack
- [ ] Choose frontend: React
- [ ] Choose backend: Node.js
- [ ] Select database: PostgreSQL
- [ ] Write description (50+ chars)
- [ ] Click through all 4 steps
- [ ] Click "Create Project"
- [ ] Project appears in dashboard
- [ ] ✅ PASS / ❌ FAIL

**Test Case 2.2: Search Projects**
- [ ] Create 3+ projects
- [ ] Type in search box
- [ ] Results filter correctly
- [ ] Clear search
- [ ] All projects visible
- [ ] ✅ PASS / ❌ FAIL

**Test Case 2.3: Open Project**
- [ ] Click on project card
- [ ] IDE workspace opens
- [ ] Project name shows in header
- [ ] Tech stack badges visible
- [ ] ✅ PASS / ❌ FAIL

**Test Case 2.4: Delete Project**
- [ ] Right-click project (future)
- [ ] OR use delete button
- [ ] Confirm deletion
- [ ] Project removed from list
- [ ] ✅ PASS / ❌ FAIL

---

### 3. IDE Workspace

**Test Case 3.1: File Explorer**
- [ ] See file tree
- [ ] Expand folders
- [ ] Collapse folders
- [ ] Click on file
- [ ] File opens in editor
- [ ] Selection highlighted
- [ ] ✅ PASS / ❌ FAIL

**Test Case 3.2: Code Editor**
- [ ] Select a file
- [ ] See file content
- [ ] Line numbers visible
- [ ] Edit text
- [ ] See unsaved indicator
- [ ] Press Ctrl+S
- [ ] Save indicator updates
- [ ] ✅ PASS / ❌ FAIL

**Test Case 3.3: File Tabs**
- [ ] Open multiple files
- [ ] See tabs appear
- [ ] Click tabs to switch
- [ ] Close tab with X
- [ ] Tab closes
- [ ] Content switches
- [ ] ✅ PASS / ❌ FAIL

**Test Case 3.4: Panel Toggles**
- [ ] Click left panel toggle
- [ ] File explorer hides/shows
- [ ] Click right panel toggle
- [ ] Side panel hides/shows
- [ ] UI adjusts smoothly
- [ ] ✅ PASS / ❌ FAIL

---

### 4. AI Agent

**Test Case 4.1: Send Message**
- [ ] Type message in agent chat
- [ ] Press Enter
- [ ] Message appears in chat
- [ ] Agent shows "thinking"
- [ ] Response received
- [ ] Response makes sense
- [ ] ✅ PASS / ❌ FAIL

**Test Case 4.2: Multi-turn Conversation**
- [ ] Send first message
- [ ] Get response
- [ ] Send follow-up
- [ ] Response references previous context
- [ ] ✅ PASS / ❌ FAIL

**Test Case 4.3: Code Generation Request**
- [ ] Ask agent to create a file
- [ ] Agent provides code
- [ ] Code is syntactically correct
- [ ] Code is relevant to request
- [ ] ✅ PASS / ❌ FAIL

---

### 5. Terminal

**Test Case 5.1: Execute Command**
- [ ] Click Terminal tab
- [ ] Type: `echo "hello"`
- [ ] Press Enter
- [ ] See output: "hello"
- [ ] ✅ PASS / ❌ FAIL

**Test Case 5.2: Command History**
- [ ] Execute command
- [ ] Press up arrow
- [ ] Previous command appears
- [ ] Press Enter
- [ ] Command executes again
- [ ] ✅ PASS / ❌ FAIL

**Test Case 5.3: Clear Terminal**
- [ ] Execute several commands
- [ ] Press Ctrl+L
- [ ] Terminal clears
- [ ] History preserved (up arrow works)
- [ ] ✅ PASS / ❌ FAIL

**Test Case 5.4: Long Output**
- [ ] Run command with long output
- [ ] Scroll works
- [ ] All output visible
- [ ] Performance remains good
- [ ] ✅ PASS / ❌ FAIL

---

### 6. Settings

**Test Case 6.1: Open Settings**
- [ ] Click settings button
- [ ] Settings modal opens
- [ ] All tabs visible
- [ ] ✅ PASS / ❌ FAIL

**Test Case 6.2: Editor Settings**
- [ ] Change font size
- [ ] Change tab size
- [ ] Toggle auto save
- [ ] Save settings
- [ ] Settings persist after restart
- [ ] ✅ PASS / ❌ FAIL

**Test Case 6.3: AI Settings**
- [ ] Change model
- [ ] Change temperature
- [ ] Change max tokens
- [ ] Save settings
- [ ] Agent uses new settings
- [ ] ✅ PASS / ❌ FAIL

**Test Case 6.4: Appearance**
- [ ] Change theme
- [ ] See theme update (after restart)
- [ ] Colors are consistent
- [ ] ✅ PASS / ❌ FAIL

---

### 7. Keyboard Shortcuts

**Test Case 7.1: File Operations**
- [ ] Ctrl+S saves file
- [ ] Ctrl+W closes file
- [ ] Ctrl+N new project works
- [ ] ✅ PASS / ❌ FAIL

**Test Case 7.2: Navigation**
- [ ] Ctrl+B toggles explorer
- [ ] Ctrl+J toggles terminal
- [ ] Ctrl+P opens quick open
- [ ] Ctrl+Shift+P opens command palette
- [ ] ✅ PASS / ❌ FAIL

**Test Case 7.3: Shortcuts Modal**
- [ ] Press Ctrl+K
- [ ] Shortcuts modal opens
- [ ] All shortcuts listed
- [ ] Searchable
- [ ] ✅ PASS / ❌ FAIL

---

### 8. Notifications

**Test Case 8.1: Success Notification**
- [ ] Trigger success action
- [ ] Green toast appears
- [ ] Message is clear
- [ ] Auto-dismisses after 5s
- [ ] ✅ PASS / ❌ FAIL

**Test Case 8.2: Error Notification**
- [ ] Trigger error
- [ ] Red toast appears
- [ ] Error message helpful
- [ ] Can manually dismiss
- [ ] ✅ PASS / ❌ FAIL

---

### 9. LLM Integration

**Test Case 9.1: Ollama Connection**
- [ ] Ollama running
- [ ] Model installed
- [ ] IDE detects Ollama
- [ ] Status shows "Connected"
- [ ] ✅ PASS / ❌ FAIL

**Test Case 9.2: Model Selection**
- [ ] Open settings
- [ ] See available models
- [ ] Switch model
- [ ] Agent uses new model
- [ ] ✅ PASS / ❌ FAIL

**Test Case 9.3: Offline Mode**
- [ ] Stop Ollama
- [ ] Try to use agent
- [ ] See clear error message
- [ ] Instructions to start Ollama
- [ ] ✅ PASS / ❌ FAIL

---

### 10. Performance

**Test Case 10.1: Startup Time**
- [ ] Close application
- [ ] Time startup
- [ ] First run: <30s acceptable
- [ ] Subsequent: <5s target
- [ ] ✅ PASS / ❌ FAIL

**Test Case 10.2: Large File**
- [ ] Open 1000+ line file
- [ ] Scrolling smooth
- [ ] Editing responsive
- [ ] No lag
- [ ] ✅ PASS / ❌ FAIL

**Test Case 10.3: Multiple Projects**
- [ ] Create 20+ projects
- [ ] Dashboard loads quickly
- [ ] Search remains fast
- [ ] ✅ PASS / ❌ FAIL

**Test Case 10.4: Memory Usage**
- [ ] Open Task Manager
- [ ] Note RAM usage
- [ ] Should be <500MB idle
- [ ] Should be <2GB active
- [ ] ✅ PASS / ❌ FAIL

---

## 🤖 Automated Testing Setup

### Unit Tests (Future)

```bash
# Install testing library
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
pnpm test
```

**Example test:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders correctly', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/Software Developer Agent IDE/i)).toBeInTheDocument();
  });
});
```

### Integration Tests (Future)

```bash
# Install Playwright
pnpm add -D @playwright/test

# Run e2e tests
pnpm test:e2e
```

---

## 📊 Performance Testing

### Metrics to Track:
- **Startup Time:** <5s target
- **Memory Usage:** <500MB idle
- **CPU Usage:** <10% idle
- **File Open Time:** <200ms
- **Agent Response:** <3s
- **Terminal Command:** <100ms

### Tools:
- Chrome DevTools (Performance tab)
- Task Manager / Activity Monitor
- Tauri DevTools
- Custom logging

---

## 👥 User Acceptance Testing

### Beta Testers:
- [ ] Recruit 10-20 testers
- [ ] Mix of skill levels
- [ ] Different OS platforms
- [ ] Provide feedback form

### Feedback Form:
1. Installation ease (1-5)
2. UI intuitiveness (1-5)
3. Agent usefulness (1-5)
4. Performance (1-5)
5. Would you use this? (Y/N)
6. What's missing?
7. What's confusing?
8. Bugs encountered?

---

## 🐛 Bug Reporting

### Bug Report Template:

```markdown
**Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
[Attach if applicable]

**Environment:**
- OS: Windows 11 / macOS 13 / Ubuntu 22.04
- IDE Version: 0.1.0
- Node Version: 18.x.x
- Rust Version: 1.75.x
```

### Priority Levels:

**Critical (P0):**
- Application crashes
- Data loss
- Security vulnerabilities
- Cannot complete core flows

**High (P1):**
- Major features broken
- Significant performance issues
- Confusing UX in critical paths

**Medium (P2):**
- Minor feature bugs
- Visual glitches
- Non-blocking issues

**Low (P3):**
- Cosmetic issues
- Nice-to-have improvements
- Documentation errors

---

## ✅ Launch Readiness Checklist

Before public release:

- [ ] All P0 bugs fixed
- [ ] 90%+ P1 bugs fixed
- [ ] Manual testing complete
- [ ] Automated tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User testing feedback incorporated
- [ ] Security audit done
- [ ] Backup & recovery tested
- [ ] Support system ready

---

## 📝 Testing Log Template

```markdown
**Date:** 2025-10-26
**Tester:** Name
**Version:** 0.1.0
**Platform:** Windows 11

**Tests Completed:** 45/50
**Pass Rate:** 90%
**Critical Bugs:** 0
**High Bugs:** 2
**Medium Bugs:** 5
**Low Bugs:** 8

**Notes:**
- File explorer works great
- Terminal occasionally slow
- Agent responses need improvement
- Overall very stable!

**Next Steps:**
- Fix high priority bugs
- Optimize terminal performance
- Improve agent prompts
```

---

## 🎯 Continuous Testing

### Daily:
- Smoke tests on main features
- Check error logs
- Monitor performance metrics

### Weekly:
- Full regression testing
- User feedback review
- Bug triage

### Before Releases:
- Complete manual testing
- All automated tests pass
- Performance benchmarks
- User acceptance testing

---

**Remember:** Testing is not a phase, it's a practice! 🧪

Keep testing, keep improving, keep building! 🚀
