// src/app/api/directory/locations/[slug]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = createServerSupabaseClient();
  const { slug } = await params
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_attributes (*),
      location_business_intelligence (*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
