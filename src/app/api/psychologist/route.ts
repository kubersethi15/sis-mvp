import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'get_extraction') {
      const { session_id } = body;
      const { data, error } = await db().from('leee_extractions')
        .select('*')
        .eq('session_id', session_id)
        .limit(1)
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ extraction: data });
    }

    if (action === 'get_all_extractions') {
      const { data, error } = await db().from('leee_extractions')
        .select('*, leee_sessions(user_id, user_profiles:user_id(full_name))')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Fallback without join if foreign key doesn't resolve
        const { data: fallback, error: fallbackErr } = await db().from('leee_extractions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 });

        // Try to enrich with candidate names manually
        const enriched = [];
        for (const ext of (fallback || [])) {
          let candidateName = null;
          try {
            const { data: session } = await db().from('leee_sessions').select('user_id').eq('id', ext.session_id).single();
            if (session?.user_id) {
              const { data: user } = await db().from('user_profiles').select('full_name').eq('id', session.user_id).single();
              candidateName = user?.full_name;
            }
          } catch {}
          enriched.push({ ...ext, candidate_name: candidateName });
        }
        return NextResponse.json({ extractions: enriched });
      }

      // Extract candidate name from joined data
      const enriched = (data || []).map((ext: any) => ({
        ...ext,
        candidate_name: ext.leee_sessions?.user_profiles?.full_name || null,
      }));

      return NextResponse.json({ extractions: enriched });
    }

    if (action === 'validate') {
      const { extraction_id, jobseeker_id, psychologist_notes, license_number, status } = body;

      const { data, error } = await db().from('psychologist_validations').insert({
        jobseeker_id: jobseeker_id || '00000000-0000-0000-0000-000000000000',
        skills_profile_snapshot: body.skills_profile || {},
        evidence_trail_snapshot: body.evidence_trail || {},
        psychologist_id: body.psychologist_id || '00000000-0000-0000-0000-000000000000',
        validation_status: status || 'validated',
        validation_notes: psychologist_notes,
        license_number,
        signature_date: new Date().toISOString(),
        methodology_references: ['PSF-HCD v1.0', 'PQF', 'RA 12313', 'WEF 2025', 'Moth Methodology', 'STAR+E+R', 'CBA'],
        validated_at: new Date().toISOString(),
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ validation: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
