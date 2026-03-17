# Kaya MVP — UI Testing Guide for Cursor Agent
## Run these tests with Cursor Agent + Browser

### Prerequisites
```bash
cd sis-mvp
npm install
npm run dev
# App should be running on http://localhost:3000
```

You will need these environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ftdnpsrbnjkvazspmenv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(get from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=(get from Supabase dashboard)
ANTHROPIC_API_KEY=sk-ant-...(your key)
```

---

## TEST 1: All Pages Load Without Errors

Visit each URL and verify:
- Page renders (no white screen, no error boundary)
- Kaya nav bar visible with Navy (#102A43) background
- No console errors (check browser DevTools)

Pages to test:
1. http://localhost:3000/ (landing page)
2. http://localhost:3000/auth (sign in / sign up)
3. http://localhost:3000/profile (4-step profile form)
4. http://localhost:3000/chat (LEEE conversation with Aya)
5. http://localhost:3000/my-dashboard (jobseeker dashboard)
6. http://localhost:3000/skills (skills profile display)
7. http://localhost:3000/vacancy (vacancy browser)
8. http://localhost:3000/employer (Gate 1 employer view)
9. http://localhost:3000/employer-dashboard (employer portal)
10. http://localhost:3000/reviewer (three-gate pipeline)
11. http://localhost:3000/psychologist (validation interface)
12. http://localhost:3000/demo-day (demo script)

**Expected result:** All 12 pages load with Kaya branding. No crashes.

---

## TEST 2: Profile Form — Full Flow

1. Go to http://localhost:3000/profile
2. Step 1 — Basic Info:
   - Enter full name: "Maria Santos"
   - Enter email: "maria@test.com"
   - Enter phone: "+639123456789"
   - Select disability type: "Physical disability"
   - VERIFY: Disability context fields appear (severity, communication impact, recently diagnosed, accommodation notes)
   - Select severity: "Moderate — I need some accommodations"
   - Select communication impact: "I need more time to process"
   - Check "recently diagnosed" checkbox
   - Enter accommodation notes: "I work best with written instructions"
   - Check challenges: "Interview communication", "Confidence — I undersell what I can do"
   - Enter location: "Cebu City"
3. Click "Next →"
4. Step 2 — Work History:
   - Enter company: "SmileAPI"
   - Enter role: "Customer Service Associate"
   - Enter start date: "2024-01"
   - Enter description: "Handled customer complaints and verification calls"
   - Check "This was informal/freelance work" if checkbox exists
5. Click "Next →"
6. Step 3 — Education:
   - Enter institution: "University of San Carlos"
   - Enter degree: "BS Information Technology"
   - Enter field: "IT"
   - Enter year: "2023"
7. Click "Next →"
8. Step 4 — Skills & Goals:
   - Enter skills: "customer service, data entry, Microsoft Office"
   - Enter career goals: "I want to work in a branch office helping customers"
   - Select preferred arrangement: "On-site"
   - Enter salary min: "15000", max: "25000"
9. Click "Save Progress"
10. VERIFY: Success toast/message appears
11. VERIFY: Profile completeness bar shows > 80%

**Expected result:** Profile saves successfully. All disability context fields visible and functional.

---

## TEST 3: Auth Flow

1. Go to http://localhost:3000/auth
2. Click "Sign Up" tab
3. Enter:
   - Name: "Test User"
   - Email: "test@kaya.work"
   - Password: "TestPassword123!"
4. Click "Create Account"
5. VERIFY: Success message or redirect to /my-dashboard

6. If sign-up succeeds, sign out (if possible) and sign back in:
   - Email: "test@kaya.work"
   - Password: "TestPassword123!"
7. VERIFY: Redirect to /my-dashboard after sign-in

**Expected result:** Auth flow works end-to-end. User is redirected after sign in.
**Note:** If Supabase email confirmation is enabled, sign-up may require email verification.

---

## TEST 4: Chat Session Start

1. Go to http://localhost:3000/chat
2. VERIFY: Welcome screen appears with language options (English, Taglish, Filipino)
3. Click "English" (or any language button)
4. VERIFY: Loading state appears
5. VERIFY: Aya's greeting message appears within 10 seconds
6. VERIFY: The greeting mentions the user's name (if profile was created in Test 2)
7. Type: "I want to share a story about my work experience"
8. Click send (or press Enter)
9. VERIFY: Message appears in chat
10. VERIFY: Aya responds with a follow-up question within 10 seconds
11. VERIFY: Story counter shows "Story 1 of 3"
12. VERIFY: Input area has placeholder text "Share your story..."

**Expected result:** Chat starts, Aya greets warmly, conversation flows naturally.

---

## TEST 5: Mobile Responsive (375px width)

1. Open browser DevTools → Toggle device toolbar → Select iPhone SE (375px)
2. Test these pages at mobile width:

   a. http://localhost:3000/profile
   - VERIFY: Form fields stack vertically (not side by side)
   - VERIFY: All text is readable (no overflow)
   - VERIFY: Buttons are tappable (minimum 44px height)

   b. http://localhost:3000/chat
   - VERIFY: Chat messages don't overflow screen
   - VERIFY: Input area is accessible at bottom
   - VERIFY: Send button is tappable

   c. http://localhost:3000/my-dashboard
   - VERIFY: Cards stack vertically
   - VERIFY: No horizontal scrolling

**Expected result:** All candidate-facing pages work at 375px width.

---

## TEST 6: Kaya Branding Consistency

Visit each page and verify:
- Nav background is Navy (#102A43)
- "KAYA" wordmark visible in nav (Georgia font, white text)
- Page background is Stone (#FAFAF9), not white or gray
- Green (#48BB78) used only for success states (buttons, progress bars, bloom mark dot)
- No references to "SIS" or "Skills Intelligence System" in any visible UI text

Pages to check: All 12 from Test 1.

**Expected result:** Consistent Kaya branding across all pages. Zero SIS references.

---

## TEST 7: Disability Context → Calibration Flow

This tests whether the R2 disability fields actually affect the conversation:

1. Create a profile with:
   - Disability type: "Psychosocial disability"
   - Severity: "Severe — I need significant support"
   - Recently diagnosed: checked
   - Communication impact: "I need more time to process"
   - Accommodation notes: "Short questions please"
   - Challenges: "Interview communication", "Confidence"
2. Start a chat session
3. VERIFY: Aya's greeting is warm and unhurried
4. VERIFY: Aya does NOT ask rapid-fire questions
5. VERIFY: Aya uses simpler language (if accessibility mode triggers)

**Expected result:** A recently-diagnosed, severe-impact candidate gets a gentler, slower conversation.
**Note:** This is hard to verify objectively — it depends on the LLM following calibration instructions.

---

## TEST 8: Demo Day Flow

1. Go to http://localhost:3000/demo
2. VERIFY: Demo seeder page loads
3. Click "Seed Demo Data" (if available)
4. VERIFY: Demo data is created (Cebuana employer, sample vacancy, sample profile)
5. Go to http://localhost:3000/demo-day
6. VERIFY: Demo script loads with all 3 acts

**Expected result:** Demo infrastructure works for Jakarta presentation.

---

## REPORTING

For each test, report:
- ✅ PASS — works as expected
- ⚠️ ISSUE — works partially, describe what's wrong
- ❌ FAIL — doesn't work, describe the error

Include screenshots for any failures.
