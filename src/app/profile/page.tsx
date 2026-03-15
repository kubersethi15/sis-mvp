'use client';

import { useState, useCallback } from 'react';

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

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.profile) {
        setProfileId(data.profile.id);
        // Store for use in other parts of the app
        localStorage.setItem('sis_jobseeker_profile_id', data.profile.id);
        if (data.user_id) localStorage.setItem('sis_user_id', data.user_id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [fullName, email, phone, disabilityType, location, workHistory, education, certifications, training, skillsInventory, careerGoals, preferredArrangement, salaryMin, salaryMax, profileId]);

  const totalSteps = 4;
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-sm text-gray-500">Step {step} of {totalSteps} — {['Basic Info', 'Work Experience', 'Education & Training', 'Skills & Goals'][step - 1]}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-600 font-medium">✅ Saved!</span>}
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600">← Home</a>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

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

              <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Disability Type <span className="text-gray-400 font-normal">(optional — helps us provide better support)</span></label>
                <select value={disabilityType} onChange={e => setDisabilityType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none bg-white">
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
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={w.company} onChange={e => updateWork(i, 'company', e.target.value)} placeholder="Company / Organization / Client" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={w.role} onChange={e => updateWork(i, 'role', e.target.value)} placeholder="Your role / title" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={e.institution} onChange={ev => updateEdu(i, 'institution', ev.target.value)} placeholder="School / Institution" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <input type="text" value={e.degree} onChange={ev => updateEdu(i, 'degree', ev.target.value)} placeholder="Degree / Certificate" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={e.field} onChange={ev => updateEdu(i, 'field', ev.target.value)} placeholder="Field of study" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <div className="flex gap-2">
                      <input type="text" value={e.year} onChange={ev => updateEdu(i, 'year', ev.target.value)} placeholder="Year" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                      <select value={e.status} onChange={ev => updateEdu(i, 'status', ev.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none bg-white">
                        <option value="completed">Completed</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="incomplete">Incomplete</option>
                      </select>
                    </div>
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
                <div className="grid grid-cols-2 gap-3">
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
                {saving ? '⏳ Saving...' : '💾 Save Progress'}
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
                  ✅ Save & Talk to Aya →
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
