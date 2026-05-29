import { NextResponse } from 'next/server';
import { createPlaceSuggestion } from '../../../lib/placeSuggestions';
import { getSiteSettings } from '../../../lib/siteSettings';
import { limiters, getClientIp, isRateLimitConfigured } from '../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const settings = await getSiteSettings();
    if (!settings.enablePlaceSuggestions) {
      return NextResponse.json(
        { ok: false, message: 'Suggestions are currently closed.' },
        { status: 403 },
      );
    }
    
    if (process.env.NODE_ENV === 'production' && !isRateLimitConfigured()) {
       console.error('CRITICAL: Public place suggestions enabled in production but persistent rate limit is NOT configured.');
       return NextResponse.json(
         { ok: false, message: 'Service temporarily unavailable. Configuration error.' },
         { status: 503 }
       );
    }

    const ip = await getClientIp();
    const rateLimitResult = await limiters.placeSuggestion.limit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { ok: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
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
