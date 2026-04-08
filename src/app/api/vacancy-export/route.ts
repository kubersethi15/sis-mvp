// Vacancy Export API - POST /api/vacancy-export
// Generates shareable vacancy page URL + QR code data
// Ryan: "exported as PDF, or shared via link and QR that will lead them to Gate 2"

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'get_share_data': return getShareData(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getShareData(body: any) {
  const { vacancy_id } = body;

  const { data: vacancy } = await db().from('vacancies')
    .select('*, employer_profiles(organization_name, inclusion_statement)')
    .eq('id', vacancy_id).single();

  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });

  // Build the share URL — leads directly to vacancy page (which has Apply button → Gate flow)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const shareUrl = `${baseUrl}/vacancy?id=${vacancy_id}`;

  // QR code URL using free API (no package needed)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  // Build printable vacancy summary
  const printData = {
    title: vacancy.title,
    employer: vacancy.employer_profiles?.organization_name || 'Unknown',
    description: vacancy.description,
    location: vacancy.location,
    work_arrangement: vacancy.work_arrangement,
    compensation: vacancy.compensation_range,
    essential_requirements: vacancy.essential_requirements,
    trainable_requirements: vacancy.trainable_requirements,
    human_centric_skills: vacancy.competency_blueprint?.human_centric_skills || [],
    inclusion_statement: vacancy.employer_profiles?.inclusion_statement,
    share_url: shareUrl,
    qr_code_url: qrCodeUrl,
  };

  return NextResponse.json({
    share_url: shareUrl,
    qr_code_url: qrCodeUrl,
    print_data: printData,
  });
}
