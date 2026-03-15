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
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ extractions: data });
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
