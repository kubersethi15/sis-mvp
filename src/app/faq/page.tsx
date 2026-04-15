'use client';

import { useState } from 'react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is Kaya?',
        a: 'Kaya is an inclusive hiring platform built by Virtualahan. It uses AI-powered conversations to discover your real skills — not just what\'s on your resume. Kaya is designed to be fair, accessible, and especially supportive of persons with disabilities.',
      },
      {
        q: 'How do I create my profile?',
        a: 'After signing up, go to your Profile page. You can either fill in your details manually or upload your resume — Kaya\'s AI will extract your information automatically. You can always edit your profile later.',
      },
      {
        q: 'Do I need a resume to use Kaya?',
        a: 'No! Many talented people don\'t have a formal resume. You can fill in your profile manually, and the conversation with Aya will help surface your skills from real-life experiences — paid work, volunteer work, family responsibilities, anything.',
      },
      {
        q: 'What file formats are supported for resume upload?',
        a: 'Kaya accepts PDF (.pdf), Word documents (.docx), and plain text (.txt) files.',
      },
    ],
  },
  {
    category: 'Talking to Aya',
    items: [
      {
        q: 'Who is Aya?',
        a: 'Aya is your AI conversation partner — think of her as a warm, supportive tita (auntie) who listens to your stories and helps discover the skills hidden in your everyday experiences. She\'s not a chatbot that answers questions about the platform — she\'s focused on your story.',
      },
      {
        q: 'What should I talk about with Aya?',
        a: 'Share real stories from your life! Times you solved a problem, helped someone, handled a difficult situation, learned something new, or overcame a challenge. It doesn\'t have to be from a formal job — stories from family, community, volunteer work, or school all count.',
      },
      {
        q: 'How long does a conversation with Aya take?',
        a: 'A typical session takes 15-30 minutes. You can share 2-3 stories, and Aya will guide you through each one with follow-up questions. Quality matters more than quantity — one detailed story is better than five vague ones.',
      },
      {
        q: 'Can I talk to Aya in Filipino or Taglish?',
        a: 'Yes! When you start a conversation, you can choose English, Taglish, or Filipino. Aya will match your language. Feel free to code-switch — Aya understands.',
      },
      {
        q: 'Is my conversation private?',
        a: 'Your conversation is stored securely and only used to generate your skills profile. Employers see your skills and evidence — not your raw conversation. A psychologist may review the analysis for quality assurance.',
      },
      {
        q: 'Can I use voice instead of typing?',
        a: 'Yes! Kaya has a voice mode. Look for the voice chat option on your dashboard or go to /chat-voice. You can speak naturally and Aya will respond with voice too.',
      },
    ],
  },
  {
    category: 'Skills & Results',
    items: [
      {
        q: 'How does Kaya identify my skills?',
        a: 'After your conversation, Kaya\'s AI analyzes your stories using a structured framework (STAR+E+R) to identify specific skills and rate your proficiency level. Each skill is backed by direct evidence from what you shared — it\'s not a guess.',
      },
      {
        q: 'What skills does Kaya look for?',
        a: 'Kaya maps to the Philippines Skills Framework (PSF), covering skills like Communication, Teamwork, Problem Solving, Digital Literacy, Customer Service, Adaptability, Work Ethic, and Self-Management. These are the skills employers value most.',
      },
      {
        q: 'What do the proficiency levels mean?',
        a: 'Basic means you can perform the skill with guidance. Intermediate means you can work independently and handle common situations. Advanced means you can lead others, handle complex situations, and adapt the skill to new contexts.',
      },
      {
        q: 'Can I improve my skills profile?',
        a: 'Yes! You can have additional conversations with Aya to share more stories. New evidence gets merged with your existing profile. The more detailed stories you share, the stronger your profile becomes.',
      },
    ],
  },
  {
    category: 'Applying for Jobs',
    items: [
      {
        q: 'How do I apply for a job on Kaya?',
        a: 'Browse available vacancies from your dashboard. When you apply, Kaya automatically generates an alignment assessment showing how your skills match the job requirements. No cover letter needed — your skills speak for themselves.',
      },
      {
        q: 'What happens after I apply?',
        a: 'Your application goes through a structured review process: first a recruiter reviews your alignment, then a hiring manager may review your full skills profile, and you may be invited for a follow-up assessment or interview.',
      },
      {
        q: 'What if I\'m not selected?',
        a: 'You\'ll receive a feedback report showing which skills to strengthen, alternative roles that might be a better fit, and recommended learning resources. It\'s not a rejection — it\'s a growth plan.',
      },
    ],
  },
  {
    category: 'Accessibility & Support',
    items: [
      {
        q: 'Is Kaya accessible for persons with disabilities?',
        a: 'Absolutely — Kaya is built with accessibility at its core. When you set up your profile, you can share your disability type and communication preferences. Aya adapts her conversation style accordingly — using shorter questions, allowing more time, or adjusting her approach.',
      },
      {
        q: 'I\'m having trouble with the platform. Who do I contact?',
        a: 'For technical issues, reach out to the Virtualahan team at support@virtualahan.com or through your Virtualahan program coordinator.',
      },
      {
        q: 'My data isn\'t saving / something looks wrong.',
        a: 'Try refreshing the page first. Make sure you click "Save Progress" after making changes to your profile. If the issue continues, try signing out and back in. If it still doesn\'t work, contact support.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-kaya-stone-50">
      {/* Nav */}
      <nav className="px-4 sm:px-6 py-3 flex items-center justify-between bg-kaya-navy-900">
        <a href="/my-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-kaya-stone-600">
            <div className="w-2.5 h-2.5 rounded-full bg-kaya-green-400" />
          </div>
          <span className="text-xl tracking-tight font-display text-kaya-navy-50">kaya</span>
        </a>
        <a href="/my-dashboard" className="text-xs text-kaya-stone-400">← Back to Dashboard</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2 text-kaya-navy-900">Frequently Asked Questions</h1>
        <p className="text-sm mb-8 text-kaya-stone-600">
          Everything you need to know about using Kaya. Can't find your answer? Email <a href="mailto:support@virtualahan.com" className="underline text-kaya-green-400">support@virtualahan.com</a>
        </p>

        {faqs.map((section) => (
          <div key={section.category} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-kaya-stone-400">
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => {
                const key = `${section.category}-${item.q}`;
                const isOpen = openIdx === key;
                return (
                  <div key={key} className="bg-white rounded-xl border border-kaya-stone-100 overflow-hidden">
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : key)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium pr-4 text-kaya-navy-900">{item.q}</span>
                      <span className="text-lg flex-none text-kaya-stone-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed text-kaya-stone-600">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
