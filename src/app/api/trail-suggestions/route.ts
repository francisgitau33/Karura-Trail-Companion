import { NextResponse } from 'next/server';
import { createTrailSuggestion } from '../../../lib/trailSuggestions';
import { getSiteSettings } from '../../../lib/siteSettings';

export async function POST(request: Request) {
  try {
    const settings = await getSiteSettings();
    if (!settings.enablePublicTrailRecording) {
      return NextResponse.json(
        { ok: false, message: 'Trail recording is currently closed.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = await createTrailSuggestion({
      type: String(body.type ?? ''),
      name: String(body.name ?? ''),
      description: String(body.description ?? ''),
      points: Array.isArray(body.points) ? body.points : [],
      durationSeconds: Number(body.durationSeconds ?? 0),
      contactEmail: String(body.contactEmail ?? ''),
      website: String(body.website ?? ''),
    });

    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch (error) {
    console.error('Trail suggestion submission failed.', error);
    return NextResponse.json(
      { ok: false, message: 'Trail could not be submitted. Please try again later.' },
      { status: 500 },
    );
  }
}
