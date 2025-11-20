// src/app/directory/[city]/[location_slug]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

type LocationPageProps = {
  params: {
    location_slug: string;
  };
};

// This function generates static pages at build time
export async function generateStaticParams() {
  const supabase = createServerSupabaseClient();
  const { data: locations } = await supabase.from('locations').select('city, slug');
  return locations?.map(location => ({
    city: location.city.toLowerCase().replace(/ /g, '-'),
    location_slug: location.slug,
  })) || [];
}

export default async function LocationPage({ params }: LocationPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: location } = await supabase
    .from('locations')
    .select(`
      *,
      location_attributes (*),
      location_business_intelligence (*)
    `)
    .eq('slug', params.location_slug)
    .single();

  if (!location) {
    notFound();
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold">{location.name}</h1>
      <p className="mt-4 text-lg">{location.description}</p>
      {/* Detailed location info, permit details, etc., will be rendered here */}
    </div>
  );
}
