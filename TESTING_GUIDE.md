# SIS MVP — End-to-End Testing Guide

## Prerequisites
1. Server running: `export NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run dev`
2. Supabase connected (check .env.local has all 4 keys)
3. Open browser to `http://localhost:3000`

---

## TEST 1: Full Manual Flow (Recommended First)

### Step 1: Create Jobseeker Profile
1. Go to `http://localhost:3000/profile`
2. Fill in: Name, email, disability type, location
3. Click Next → Add work experience (can be informal)
4. Click Next → Add education, certifications
5. Click Next → Add skills, career goals, preferred arrangement
6. Click **Save & Talk to Aya**

### Step 2: Chat with Aya (LEEE Conversation)
1. You'll land on `/chat`
2. Have a natural conversation — share 1-2 real stories
3. Chat for 10-15 messages (at least one full story with action/decision/outcome)
4. Click **Finish conversation** at the bottom
5. Click **Discover My Superpowers**
6. Wait for extraction (5-10 seconds)
7. Click **View My Skills Profile →**

### Step 3: Check Skills Dashboard
1. You'll be on `/skills`
2. Verify: skills extracted, proficiency bars, confidence scores
3. Click a skill to see evidence (transcript quotes)
4. Check "What's Next" simulation seeds
5. Check gaming flags (if any)

### Step 4: Employer — Upload JD
1. Go to `http://localhost:3000/employer`
2. Paste a Cebuana Lhuillier JD (from ph.jobstreet.com/cebuana-lhuillier-jobs)
3. Click **Analyze & Create Vacancy**
4. Verify: competency blueprint, essential vs trainable, human-centric skills

### Step 5: Run Full Pipeline
1. Go to `http://localhost:3000/demo`
2. Check prerequisites (profile ✅, LEEE session ✅, employer auto-seeds)
3. Click **Run Full End-to-End Pipeline**
4. Watch the log — should see:
   - ✅ Seed data
   - ✅ Profile found
   - ✅ Application created
   - 🔵 Gate 1 running → ✅ complete with alignment score
   - 🟢 Gate 2 running → ✅ complete with evidence rating
   - 🟣 Gate 3 running → ✅ complete with readiness index
   - 🎉 Pipeline complete

### Step 6: Check Reviewer Dashboard
1. Go to `http://localhost:3000/reviewer`
2. Check Pipeline Overview
3. Check each gate tab

---

## TEST 2: Automated Pipeline (Demo Page)

If you've already done the manual flow (Steps 1-3), you can jump straight to:
1. `/demo` → Run Full Pipeline
2. This auto-seeds data, creates application, runs all 3 gates

---

## TEST 3: Things to Verify in Supabase

Go to: https://supabase.com/dashboard/project/ftdnpsrbnjkvazspmenv/editor

Check these tables have data:
- `user_profiles` — at least 1 demo user
- `jobseeker_profiles` — your profile with work history, education, skills
- `employer_profiles` — Cebuana Lhuillier
- `vacancies` — Branch Staff vacancy
- `leee_sessions` — your chat sessions
- `leee_messages` — all conversation messages with moth_stage
- `leee_extractions` — extraction results with skills_profile JSON
- `applications` — your application with status
- `gate1_results` — alignment score + recommendation
- `gate2_results` — evidence rating + LEEE link
- `gate3_results` — readiness index + recommendation
- `skills_taxonomy` — 8 PSF skills seeded

---

## TEST 4: Edge Cases to Try

- [ ] Chat with Aya in Taglish — does she mirror the language?
- [ ] Give very short answers — does she probe for more detail?
- [ ] Tell a vague/generic story — does she ask for specifics?
- [ ] Say something emotional — does she acknowledge warmly?
- [ ] Try to game it (rehearsed perfect story) — does she ask verification probes?
- [ ] Create profile with minimal info — does completion percentage work?
- [ ] Upload a completely different industry JD — does the parser handle it?
- [ ] Run pipeline without LEEE session — does Gate 2 still work (profile-only)?

---

## TEST 5: Using Cursor Agent

In Cursor, you can use the Agent feature to help test:

1. Open Cursor terminal
2. Ask the agent: "Can you run through the test scenarios in TESTING_GUIDE.md and report what works and what breaks?"
3. The agent can:
   - Check if the dev server is running
   - Use `curl` to hit API endpoints directly
   - Verify Supabase data via the API
   - Report any errors from the terminal

### Quick API Tests (paste in terminal):

```bash
# Check demo state
curl -s http://localhost:3000/api/demo -X POST -H "Content-Type: application/json" -d '{"action":"get_demo_state"}' | python3 -m json.tool

# Seed demo data
curl -s http://localhost:3000/api/demo -X POST -H "Content-Type: application/json" -d '{"action":"seed_demo_data"}' | python3 -m json.tool

# Start a chat session
curl -s http://localhost:3000/api/chat -X POST -H "Content-Type: application/json" -d '{"action":"start","language":"en"}' | python3 -m json.tool
```

---

## Expected Results

| Test | Expected | Status |
|------|----------|--------|
| Profile creation | Saves to Supabase, shows completion % | ⬜ |
| Chat with Aya | Natural warm conversation, follows stories | ⬜ |
| Extraction | Skills extracted with evidence + confidence | ⬜ |
| Skills dashboard | Visual display with proficiency bars | ⬜ |
| JD parsing | Competency blueprint with essential/trainable split | ⬜ |
| Full pipeline | All 3 gates pass, readiness index generated | ⬜ |
| Supabase persistence | All tables have correct data | ⬜ |
| Transcript download | .txt file with staged conversation | ⬜ |
