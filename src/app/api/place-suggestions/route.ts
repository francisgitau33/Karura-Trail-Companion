import { NextResponse } from 'next/server';
import { createPlaceSuggestion } from '../../../lib/placeSuggestions';
import { getSiteSettings } from '../../../lib/siteSettings';

export async function POST(request: Request) {
  try {
    const settings = await getSiteSettings();
    if (!settings.enablePlaceSuggestions) {
      return NextResponse.json(
        { ok: false, message: 'Suggestions are currently closed.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = await createPlaceSuggestion({
      type: String(body.type ?? ''),
      name: String(body.name ?? ''),
      description: String(body.description ?? ''),
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      contactEmail: String(body.contactEmail ?? ''),
      website: String(body.website ?? ''),
    });

    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch (error) {
    console.error('Place suggestion submission failed.', error);
    return NextResponse.json(
      { ok: false, message: 'Suggestion could not be submitted. Please try again later.' },
      { status: 500 },
    );
  }
}
