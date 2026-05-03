import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/scores?game=chess&limit=10
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game  = searchParams.get('game');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 100);

  if (!game || !/^[a-z_-]{1,30}$/.test(game)) {
    return NextResponse.json({ error: 'Invalid game parameter' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('game_scores')
    .select('id, score, metadata, created_at, user_profiles(username, avatar_url)')
    .eq('game_slug', game)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[scores GET]', error.message);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }

  return NextResponse.json({ scores: data });
}

// POST /api/scores
// Body: { game_slug, score, user_id?, metadata? }
export async function POST(req: NextRequest) {
  let body: { game_slug?: string; score?: number; user_id?: string; metadata?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { game_slug, score, user_id, metadata } = body;

  // Validate
  if (typeof game_slug !== 'string' || !/^[a-z_-]{1,30}$/.test(game_slug)) {
    return NextResponse.json({ error: 'Invalid game_slug' }, { status: 400 });
  }
  if (typeof score !== 'number' || !isFinite(score) || score < 0 || score > 1_000_000) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }
  if (user_id !== undefined && (typeof user_id !== 'string' || !/^[0-9a-f-]{36}$/.test(user_id))) {
    return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('game_scores')
    .insert({ game_slug, score, user_id: user_id ?? null, metadata: metadata ?? null })
    .select('id')
    .single();

  if (error) {
    console.error('[scores POST]', error.message);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
