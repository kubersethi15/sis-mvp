import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for pdf-parse (CommonJS module)
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (e: any) {
    console.error('pdf-parse failed:', e.message);
    // Fallback: extract readable ASCII from the buffer
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// Extract text from .docx (ZIP containing XML)
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) return '';
    // Strip XML tags, decode entities, clean whitespace
    return docXml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e: any) {
    console.error('docx extraction failed:', e.message);
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Extract text from file
    let text = '';
    const type = file.type;

    if (type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text();
    } else if (type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    } else if (file.name.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractDocxText(buffer);
    } else {
      // Last resort — read as text best-effort
      const buffer = Buffer.from(await file.arrayBuffer());
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (text.length < 20) {
      return NextResponse.json({ error: 'Could not extract text from file. Try a .txt or .pdf file.' }, { status: 400 });
    }

    // Truncate to avoid token limits
    const truncated = text.substring(0, 8000);

    // Call Claude to extract structured profile data
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You extract structured profile data from resumes. Return ONLY valid JSON, no markdown, no explanation.',
        messages: [{
          role: 'user',
          content: `Extract structured profile data from this resume text. Return JSON with these exact fields:

{
  "full_name": "string",
  "email": "string or empty",
  "phone": "string or empty",
  "location": "string or empty",
  "work_history": [
    {
      "company": "string",
      "role": "string",
      "start_date": "YYYY-MM or empty",
      "end_date": "YYYY-MM or 'present' or empty",
      "description": "brief description of responsibilities",
      "is_informal": false
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or empty",
      "year": "YYYY or empty",
      "status": "completed" or "ongoing" or "incomplete"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "skills_inventory": "comma-separated skills found",
  "career_goals": "inferred from resume or empty"
}

Resume text:
${truncated}`,
        }],
      }),
    });

    const data = await res.json();
    const responseText = data.content?.find((b: any) => b.type === 'text')?.text || '';

    // Parse JSON — handle potential markdown fencing
    let profile;
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      profile = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse extracted data', raw: responseText }, { status: 500 });
    }

    return NextResponse.json({ profile, filename: file.name });
  } catch (e: any) {
    console.error('Resume extraction error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
