// src/app/api/galleries/[id]/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params

  // Restore the gallery
  const { error: galleryError } = await supabase
    .from('photo_galleries')
    .update({ status: 'active', deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id);

  if (galleryError) {
    console.error('Error restoring gallery:', galleryError);
    return NextResponse.json({ error: 'Failed to restore gallery' }, { status: 500 });
  }

  // Restore the photos within the gallery
  const { error: photosError } = await supabase
    .from('gallery_photos')
    .update({ status: 'active', deleted_at: null })
    .eq('gallery_id', id);

  if (photosError) {
    // Note: At this point, the gallery is restored but photos are not.
    // You might want to add more robust transaction handling here in a real-world scenario.
    console.error('Error restoring photos for gallery:', photosError);
    return NextResponse.json({ error: 'Failed to restore photos' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Gallery and photos restored.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params

  // The trigger in the database will handle the soft delete.
  // We just need to execute a DELETE command, and the trigger will intercept it.
  const { error } = await supabase
    .from('photo_galleries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure users can only delete their own galleries

  if (error) {
    console.error('Error soft deleting gallery:', error);
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Gallery moved to recently deleted.' });
}
