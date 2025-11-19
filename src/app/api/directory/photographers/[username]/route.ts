// src/app/api/directory/photographers/[username]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = createClient();
  const { username } = await params
  const { data, error } = await supabase
    .from('photographer_profiles')
    .select(`
      *,
      reviews (*)
    `)
    .eq('username', username)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
