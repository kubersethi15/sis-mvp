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

      // Extract candidate name from joined data + fix confidence from raw pipeline
      const enriched = (data || []).map((ext: any) => {
        const result = {
          ...ext,
          candidate_name: ext.leee_sessions?.user_profiles?.full_name || null,
        };

        // Fix confidence: if all skills show 0.5, recalculate from raw pipeline data
        const allHalf = result.skills_profile?.every((s: any) => s.confidence === 0.5);
        if (allHalf && result.raw_extraction_response?.final_profile) {
          const raw = result.raw_extraction_response.final_profile;
          const rawSkillMap: Record<string, number> = {};

          for (const s of (raw.vacancy_aligned_skills || [])) {
            rawSkillMap[s.skill_name] = s.top_evidence?.adjusted_confidence || s.adjusted_confidence || s.confidence || 0.5;
          }
          for (const s of (raw.additional_skills_evidenced || [])) {
            rawSkillMap[s.skill_name] = s.top_evidence?.adjusted_confidence || s.adjusted_confidence || s.confidence || 0.5;
          }

          // Also try Stage 3 mappings for confidence
          const stage3 = result.raw_extraction_response?.pipeline_stages?.stage3_mappings;
          if (stage3 && Array.isArray(stage3)) {
            for (const m of stage3) {
              if (m.skill_name && m.confidence && !rawSkillMap[m.skill_name]) {
                rawSkillMap[m.skill_name] = m.confidence;
              }
            }
          }

          result.skills_profile = result.skills_profile?.map((s: any) => ({
            ...s,
            confidence: rawSkillMap[s.skill_name] || (s.proficiency?.toLowerCase() === 'advanced' ? 0.85 : s.proficiency?.toLowerCase() === 'intermediate' ? 0.72 : 0.55),
          }));
        }

        return result;
      });

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
