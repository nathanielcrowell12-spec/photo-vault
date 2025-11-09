// src/app/api/directory/locations/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const state = searchParams.get('state');
  // Add more filters as needed, e.g., for location_attributes

  const supabase = createServerSupabaseClient();
  let query = supabase.from('locations').select('*');

  if (city) {
    query = query.eq('city', city);
  }
  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
