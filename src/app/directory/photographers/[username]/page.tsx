// src/app/directory/photographers/[username]/page.tsx
import { createClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';

type PhotographerProfileProps = {
  params: {
    username: string;
  };
};

export async function generateStaticParams() {
    const supabase = createClient();
    const { data: profiles } = await supabase.from('photographer_profiles').select('username');
    return profiles?.map(profile => ({
        username: profile.username,
    })) || [];
}

export default async function PhotographerProfilePage({ params }: PhotographerProfileProps) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select(`
      *,
      reviews (*)
    `)
    .eq('username', params.username)
    .single();

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold">{profile.business_name || profile.username}</h1>
      <p className="mt-4 text-lg">{profile.bio}</p>
      {/* Photographer portfolio, reviews, etc., will be rendered here */}
    </div>
  );
}
