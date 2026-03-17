'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { kayaFetch } from '@/lib/kaya-fetch';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================
// TYPES
// ============================================================

interface WorkEntry {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  description: string;
  is_informal: boolean;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year: string;
  status: 'completed' | 'ongoing' | 'incomplete';
}

// ============================================================
// COMPONENT
// ============================================================

export default function ProfilePage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [location, setLocation] = useState('');
  // R2: Structured disability context
  const [disabilitySeverity, setDisabilitySeverity] = useState('');
  const [recentlyDiagnosed, setRecentlyDiagnosed] = useState(false);
  const [communicationImpact, setCommunicationImpact] = useState('');
  const [accommodationNotes, setAccommodationNotes] = useState('');
  // R11: Self-reported challenges
  const [challenges, setChallenges] = useState<string[]>([]);

  // Step 2: Work History
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>([{
    company: '', role: '', start_date: '', end_date: '', description: '', is_informal: false
  }]);

  // Step 3: Education & Training
  const [education, setEducation] = useState<EducationEntry[]>([{
    institution: '', degree: '', field: '', year: '', status: 'completed'
  }]);
  const [certifications, setCertifications] = useState('');
  const [training, setTraining] = useState('');

  // Step 4: Skills & Goals
  const [skillsInventory, setSkillsInventory] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [preferredArrangement, setPreferredArrangement] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  // Add/remove work entries
  const addWorkEntry = () => setWorkHistory(prev => [...prev, { company: '', role: '', start_date: '', end_date: '', description: '', is_informal: false }]);

  // Pre-fill from auth session + load existing profile
  useEffect(() => {
    async function loadData() {
      // 1. Pre-fill from Supabase auth
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          if (user.user_metadata?.full_name && !fullName) setFullName(user.user_metadata.full_name);
          if (user.email && !email) setEmail(user.email);
          localStorage.setItem('kaya_user_id', user.id);
        }
      } catch {}

      // 2. Load existing profile if we have one
      const storedProfileId = localStorage.getItem('kaya_jobseeker_profile_id');
      const userId = localStorage.getItem('kaya_user_id');

      if (storedProfileId) {
        try {
          const res = await kayaFetch('/api/profile', { action: 'get', profile_id: storedProfileId });
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setProfileId(p.id);
            if (p.user_profiles?.full_name) setFullName(p.user_profiles.full_name);
            if (p.disability_type) setDisabilityType(p.disability_type);
            if (p.disability_context?.severity) setDisabilitySeverity(p.disability_context.severity);
            if (p.disability_context?.recently_diagnosed) setRecentlyDiagnosed(true);
            if (p.disability_context?.communication_impact) setCommunicationImpact(p.disability_context.communication_impact);
            if (p.disability_context?.accommodation_notes) setAccommodationNotes(p.disability_context.accommodation_notes);
            if (p.self_reported_challenges?.length) setChallenges(p.self_reported_challenges);
            if (p.preferred_location) setLocation(p.preferred_location);
            if (p.work_history?.length) setWorkHistory(p.work_history);
            if (p.education?.length) setEducation(p.education);
            if (p.certifications?.length) setCertifications(p.certifications.join(', '));
            if (p.training?.length) setTraining(p.training.join(', '));
            if (p.skills_inventory?.length) setSkillsInventory(p.skills_inventory.join(', '));
            if (p.career_goals) setCareerGoals(p.career_goals);
            if (p.preferred_work_arrangement) setPreferredArrangement(p.preferred_work_arrangement);
            if (p.salary_expectations?.min) setSalaryMin(p.salary_expectations.min);
            if (p.salary_expectations?.max) setSalaryMax(p.salary_expectations.max);
          }
        } catch {}
      } else if (userId) {
        // Try to find profile by user_id
        try {
          const res = await kayaFetch('/api/profile', { action: 'get_by_user', user_id: userId });
          const data = await res.json();
          if (data.profile) {
            localStorage.setItem('kaya_jobseeker_profile_id', data.profile.id);
            setProfileId(data.profile.id);
            // Reload to populate fields
            window.location.reload();
          }
        } catch {}
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const removeWorkEntry = (i: number) => setWorkHistory(prev => prev.filter((_, idx) => idx !== i));
  const updateWork = (i: number, field: keyof WorkEntry, value: any) => {
    setWorkHistory(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: value } : w));
  };

  // Add/remove education entries
  const addEduEntry = () => setEducation(prev => [...prev, { institution: '', degree: '', field: '', year: '', status: 'completed' }]);
  const removeEduEntry = (i: number) => setEducation(prev => prev.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, field: keyof EducationEntry, value: any) => {
    setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  // Save profile
  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const body: any = {
        action: profileId ? 'update' : 'create',
        full_name: fullName,
        email,
        phone,
        disability_type: disabilityType || null,
        disability_context: disabilityType ? {
          disclosed: true,
          type: disabilityType,
          severity: disabilitySeverity || null,
          recently_diagnosed: recentlyDiagnosed,
          communication_impact: communicationImpact || null,
          accommodation_notes: accommodationNotes || null,
          sensitivity_level: (recentlyDiagnosed || disabilitySeverity === 'severe') ? 'high' : (disabilitySeverity === 'moderate' ? 'moderate' : 'low'),
        } : {},
        self_reported_challenges: challenges,
        preferred_location: location,
        work_history: workHistory.filter(w => w.company || w.role),
        education: education.filter(e => e.institution || e.degree),
        certifications: certifications ? certifications.split(',').map(c => c.trim()).filter(Boolean) : [],
        training: training ? training.split(',').map(t => t.trim()).filter(Boolean) : [],
        skills_inventory: skillsInventory ? skillsInventory.split(',').map(s => s.trim()).filter(Boolean) : [],
        career_goals: careerGoals,
        preferred_work_arrangement: preferredArrangement,
        salary_expectations: { min: salaryMin, max: salaryMax, currency: 'PHP' },
      };

      if (profileId) body.profile_id = profileId;

      const res = await kayaFetch('/api/profile', body);
      const data = await res.json();

      if (data.profile) {
        setProfileId(data.profile.id);
        // Store for use in other parts of the app
        localStorage.setItem('kaya_jobseeker_profile_id', data.profile.id);
        if (data.user_id) localStorage.setItem('kaya_user_id', data.user_id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [fullName, email, phone, disabilityType, disabilitySeverity, recentlyDiagnosed, communicationImpact, accommodationNotes, challenges, location, workHistory, education, certifications, training, skillsInventory, careerGoals, preferredArrangement, salaryMin, salaryMax, profileId]);

  const totalSteps = 4;
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Kaya Nav */}
      <nav className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-medium" style={{ color: '#48BB78' }}>Saved</span>}
          {fullName && (
            <span className="text-xs hidden sm:inline" style={{ color: '#BCCCDC' }}>{fullName}</span>
          )}
          <a href="/my-dashboard" className="text-xs font-medium px-2 py-1 rounded hover:opacity-80 transition-opacity" style={{ background: '#243B53', color: '#BCCCDC' }}>
            Dashboard
          </a>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/auth';
            }}
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: '#829AB1' }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#102A43' }}>Your Profile</h1>
          <p className="text-sm" style={{ color: '#627D98' }}>Step {step} of {totalSteps} — {['Basic Info', 'Work Experience', 'Education & Training', 'Skills & Goals'][step - 1]}</p>
        </div>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full rounded-full h-2" style={{ background: '#E2E8F0' }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#48BB78' }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">

          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">About You</h2>
                <p className="text-sm text-gray-500 mb-4">Basic information to get started. All fields are optional except your name.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#334E68' }}>Disability Type <span className="font-normal" style={{ color: '#829AB1' }}>(optional — helps us adapt your experience)</span></label>
                <select value={disabilityType} onChange={e => setDisabilityType(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none bg-white" style={{ borderColor: '#D9E2EC' }}>
                  <option value="">Prefer not to say</option>
                  <option value="physical">Physical disability</option>
                  <option value="visual">Visual impairment</option>
                  <option value="hearing">Hearing impairment</option>
                  <option value="cognitive">Cognitive / Learning disability</option>
                  <option value="psychosocial">Psychosocial disability</option>
                  <option value="chronic">Chronic illness</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* R2: Disability context — only shown if disability type selected */}
              {disabilityType && (
                <div className="p-4 rounded-xl space-y-4" style={{ background: '#F0F4F8', border: '1px solid #D9E2EC' }}>
                  <p className="text-xs" style={{ color: '#627D98' }}>These details help us adapt your conversation experience. All fields are optional and treated with care.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#486581' }}>How would you describe the impact?</label>
                      <select value={disabilitySeverity} onChange={e => setDisabilitySeverity(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" style={{ borderColor: '#D9E2EC' }}>
                        <option value="">Prefer not to say</option>
                        <option value="mild">Mild — I manage most things independently</option>
                        <option value="moderate">Moderate — I need some accommodations</option>
                        <option value="severe">Severe — I need significant support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#486581' }}>Does it affect how you communicate?</label>
                      <select value={communicationImpact} onChange={e => setCommunicationImpact(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" style={{ borderColor: '#D9E2EC' }}>
                        <option value="">No impact</option>
                        <option value="speech_variation">Speech patterns may vary</option>
                        <option value="verbal_difficulty">Verbal communication is harder</option>
                        <option value="processing_time">I need more time to process</option>
                        <option value="written_preference">I express myself better in writing</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recentlyDiagnosed" checked={recentlyDiagnosed} onChange={e => setRecentlyDiagnosed(e.target.checked)} className="rounded" />
                    <label htmlFor="recentlyDiagnosed" className="text-sm" style={{ color: '#486581' }}>This is a recent diagnosis or change (within the last year)</label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#486581' }}>Anything else we should know? <span className="font-normal" style={{ color: '#829AB1' }}>(optional)</span></label>
                    <textarea value={accommodationNotes} onChange={e => setAccommodationNotes(e.target.value)} placeholder="e.g. I work best with shorter questions, I may need extra time to respond..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: '#D9E2EC' }} />
                  </div>
                </div>
              )}

              {/* R11: Self-reported challenges */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#334E68' }}>What challenges do you face in finding work? <span className="font-normal" style={{ color: '#829AB1' }}>(select all that apply)</span></label>
                <div className="space-y-2">
                  {[
                    'Interview communication — expressing myself professionally',
                    'Getting past initial screening — qualifications or bias',
                    'Limited professional network or references',
                    'Limited formal work experience or credentials',
                    'Career transition — moving into a new field',
                    'Time pressure — need to find work urgently',
                    'Confidence — I undersell what I can do',
                    'Accessibility — workplaces don\'t accommodate my needs',
                  ].map(challenge => (
                    <label key={challenge} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={challenges.includes(challenge)}
                        onChange={e => {
                          if (e.target.checked) setChallenges(prev => [...prev, challenge]);
                          else setChallenges(prev => prev.filter(c => c !== challenge));
                        }}
                        className="rounded mt-0.5"
                      />
                      <span className="text-sm" style={{ color: '#486581' }}>{challenge}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Province" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none" />
              </div>
            </div>
          )}

          {/* STEP 2: WORK HISTORY */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Work Experience</h2>
                <p className="text-sm text-gray-500 mb-4">Include all types of work — formal jobs, freelance, sidelines, family business, volunteer work. Everything counts.</p>
              </div>

              {workHistory.map((w, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Experience {i + 1}</span>
                    {workHistory.length > 1 && (
                      <button onClick={() => removeWorkEntry(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={w.company} onChange={e => updateWork(i, 'company', e.target.value)} placeholder="Company / Organization / Client" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={w.role} onChange={e => updateWork(i, 'role', e.target.value)} placeholder="Your role / title" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={w.start_date} onChange={e => updateWork(i, 'start_date', e.target.value)} placeholder="Start (e.g. Jan 2020)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={w.end_date} onChange={e => updateWork(i, 'end_date', e.target.value)} placeholder="End (or 'Present')" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                  <textarea value={w.description} onChange={e => updateWork(i, 'description', e.target.value)} placeholder="What did you do? What were you responsible for?" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none resize-none" />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={w.is_informal} onChange={e => updateWork(i, 'is_informal', e.target.checked)} className="rounded border-gray-300 text-teal-500 focus:ring-teal-300" />
                    This was informal / freelance / volunteer / family work
                  </label>
                </div>
              ))}

              <button onClick={addWorkEntry} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors">
                + Add Another Experience
              </button>
            </div>
          )}

          {/* STEP 3: EDUCATION & TRAINING */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Education & Training</h2>
                <p className="text-sm text-gray-500 mb-4">Formal education, Virtualahan training, online courses, TESDA certifications — include everything.</p>
              </div>

              {education.map((e, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Education {i + 1}</span>
                    {education.length > 1 && (
                      <button onClick={() => removeEduEntry(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={e.institution} onChange={ev => updateEdu(i, 'institution', ev.target.value)} placeholder="School / Institution" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={e.degree} onChange={ev => updateEdu(i, 'degree', ev.target.value)} placeholder="Degree / Certificate" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={e.field} onChange={ev => updateEdu(i, 'field', ev.target.value)} placeholder="Field of study" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={e.year} onChange={ev => updateEdu(i, 'year', ev.target.value)} placeholder="Year" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <select value={e.status} onChange={ev => updateEdu(i, 'status', ev.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none bg-white">
                      <option value="completed">Completed</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </div>
                </div>
              ))}

              <button onClick={addEduEntry} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors">
                + Add Another Education Entry
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="e.g. TESDA NC II, Virtualahan Digital Skills, Google IT Support" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Programs <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={training} onChange={e => setTraining(e.target.value)} placeholder="e.g. Virtualahan Customer Service 2024, DICT SPARK VA 2.0" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
              </div>
            </div>
          )}

          {/* STEP 4: SKILLS & GOALS */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Skills & Career Goals</h2>
                <p className="text-sm text-gray-500 mb-4">Tell us about your skills and what you're looking for. This helps match you with the right opportunities.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={skillsInventory} onChange={e => setSkillsInventory(e.target.value)} placeholder="e.g. Microsoft Office, data entry, customer service, social media management" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Career Goals</label>
                <textarea value={careerGoals} onChange={e => setCareerGoals(e.target.value)} placeholder="What kind of role are you looking for? What do you want to achieve?" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Work Arrangement</label>
                <select value={preferredArrangement} onChange={e => setPreferredArrangement(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none bg-white">
                  <option value="">No preference</option>
                  <option value="remote">Remote / Work from Home</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Expectations (PHP monthly)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Minimum" className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  <input type="text" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Maximum" className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={saveProfile}
                disabled={saving || !fullName.trim()}
                className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 disabled:opacity-30 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>

              {step < totalSteps ? (
                <button
                  onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
                  className="px-6 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await saveProfile();
                    window.location.href = '/chat';
                  }}
                  disabled={saving || !fullName.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Save & Talk to Aya →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Completion indicator */}
        {profileId && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Profile ID: {profileId.substring(0, 8)}... • Saved to database</p>
          </div>
        )}
      </div>
    </div>
  );
}
