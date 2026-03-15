// Profile API Route - POST /api/profile
// Jobseeker profile CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() {
  return createServerClient();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': return createProfile(body);
      case 'update': return updateProfile(body);
      case 'get': return getProfile(body);
      case 'get_by_user': return getByUser(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function createProfile(body: any) {
  const supabase = db();

  // Ensure user exists
  let userId = body.user_id;
  if (!userId) {
    const { data: user, error: userErr } = await supabase
      .from('user_profiles')
      .insert({
        full_name: body.full_name || 'Unknown',
        role: 'jobseeker',
        email: body.email || null,
        phone: body.phone || null,
        language_preference: body.language_preference || 'en',
        accessibility_needs: body.accessibility_needs || {},
      })
      .select('id')
      .single();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    userId = user.id;
  }

  const { data, error } = await supabase.from('jobseeker_profiles').insert({
    user_id: userId,
    disability_type: body.disability_type || null,
    education: body.education || [],
    certifications: body.certifications || [],
    training: body.training || [],
    work_history: body.work_history || [],
    skills_inventory: body.skills_inventory || [],
    career_goals: body.career_goals || null,
    preferred_work_arrangement: body.preferred_work_arrangement || null,
    preferred_schedule: body.preferred_schedule || {},
    preferred_location: body.preferred_location || null,
    salary_expectations: body.salary_expectations || {},
    portfolio_items: body.portfolio_items || [],
    reference_contacts: body.reference_contacts || [],
    riasec_scores: body.riasec_scores || {},
    high5_strengths: body.high5_strengths || [],
    saboteur_scores: body.saboteur_scores || {},
    completion_percentage: calculateCompletion(body),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data, user_id: userId });
}

async function updateProfile(body: any) {
  const { profile_id, ...updates } = body;
  if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 });

  // Remove action from updates
  delete updates.action;

  updates.completion_percentage = calculateCompletion(updates);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await db().from('jobseeker_profiles')
    .update(updates)
    .eq('id', profile_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

async function getProfile(body: any) {
  const { profile_id } = body;
  const { data, error } = await db().from('jobseeker_profiles')
    .select('*, user_profiles(*)')
    .eq('id', profile_id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

async function getByUser(body: any) {
  const { user_id } = body;
  const { data, error } = await db().from('jobseeker_profiles')
    .select('*, user_profiles(*)')
    .eq('user_id', user_id)
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

function calculateCompletion(data: any): number {
  let filled = 0;
  let total = 10;

  if (data.disability_type) filled++;
  if (data.education?.length > 0) filled++;
  if (data.certifications?.length > 0) filled++;
  if (data.training?.length > 0) filled++;
  if (data.work_history?.length > 0) filled++;
  if (data.skills_inventory?.length > 0) filled++;
  if (data.career_goals) filled++;
  if (data.preferred_work_arrangement) filled++;
  if (data.preferred_location) filled++;
  if (data.salary_expectations?.min || data.salary_expectations?.max) filled++;

  return Math.round((filled / total) * 100);
}
