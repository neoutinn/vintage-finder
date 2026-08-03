import { NextRequest, NextResponse } from 'next/server';
import { connectDepop, searchDepop } from '@scrapers/depop';
import { connectFacebook, searchFacebookMarketplace } from '@scrapers/facebookMarketplace';
import type { Source } from '@/lib/providers/types';

export const dynamic = 'force-dynamic';

type MarketplacePlatform = Extract<Source, 'depop' | 'facebook'>;

function isMarketplacePlatform(value: string | null): value is MarketplacePlatform {
  return value === 'depop' || value === 'facebook';
}

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform');
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!isMarketplacePlatform(platform)) {
    return NextResponse.json({ error: 'platform must be "depop" or "facebook"' }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: 'Missing required "q" query parameter' }, { status: 400 });
  }

  try {
    const results = await (platform === 'depop' ? searchDepop(query) : searchFacebookMarketplace(query));
    return NextResponse.json({ results, error: null });
  } catch (err) {
    return NextResponse.json({
      results: [],
      error: err instanceof Error ? err.message : `${platform} search failed`,
    });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { platform?: string } | null;
  const platform = body?.platform ?? null;

  if (!isMarketplacePlatform(platform)) {
    return NextResponse.json({ error: 'platform must be "depop" or "facebook"' }, { status: 400 });
  }

  try {
    await (platform === 'depop' ? connectDepop() : connectFacebook());
    return NextResponse.json({ connected: true });
  } catch (err) {
    return NextResponse.json(
      { connected: false, error: err instanceof Error ? err.message : 'Connect failed' },
      { status: 500 },
    );
  }
}
