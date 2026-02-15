// src/app/directory/photographers/[username]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type PhotographerProfileProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateStaticParams() {
    const supabase = createServerSupabaseClient();
    const { data: profiles } = await supabase.from('photographer_profiles').select('username');
    return profiles?.map(profile => ({
        username: profile.username,
    })) || [];
}

export async function generateMetadata({ params }: PhotographerProfileProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select('username, business_name, bio, city, state')
    .eq('username', username)
    .single();

  if (!profile) {
    return { title: 'Photographer Not Found | PhotoVault' };
  }

  const name = profile.business_name || profile.username;
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const locationSuffix = location ? ` in ${location}` : '';

  return {
    title: `${name} - Photographer${locationSuffix} | PhotoVault`,
    description: profile.bio
      ? profile.bio.slice(0, 155)
      : `View ${name}'s photography portfolio and book a session${locationSuffix}. Professional photographer on PhotoVault.`,
    openGraph: {
      type: 'profile',
      title: `${name} | PhotoVault Photographer`,
      description: profile.bio || `Professional photographer${locationSuffix}`,
      url: `https://photovault.photo/directory/photographers/${username}`,
    },
    alternates: {
      canonical: `https://photovault.photo/directory/photographers/${username}`,
    },
  };
}

export default async function PhotographerProfilePage({ params }: PhotographerProfileProps) {
  const { username } = await params;
  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select(`
      *,
      reviews (*)
    `)
    .eq('username', username)
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
