import { NextResponse } from 'next/server';
import { hasSession } from '@scrapers/session-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    depop: hasSession('depop'),
    facebook: hasSession('facebook'),
  });
}
