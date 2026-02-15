// src/app/api/galleries/[id]/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params

  // First, verify the user owns this gallery (either as photographer or as client/user)
  const { data: gallery, error: fetchError } = await supabase
    .from('photo_galleries')
    .select('id, photographer_id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !gallery) {
    logger.error('[Galleries] Gallery not found for restore:', fetchError);
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Check ownership: user must be either the photographer OR the user_id owner
  const isPhotographer = gallery.photographer_id === user.id;
  const isOwner = gallery.user_id === user.id;

  if (!isPhotographer && !isOwner) {
    logger.error('[Galleries] Unauthorized restore attempt:', { userId: user.id, gallery });
    return NextResponse.json({ error: 'You do not have permission to restore this gallery' }, { status: 403 });
  }

  // Restore the gallery (set is_deleted back to false, clear deleted_at)
  // Note: Photos are NOT individually soft-deleted — they remain linked to the gallery.
  // When gallery is restored, photos are automatically available again.
  const { error: galleryError } = await supabase
    .from('photo_galleries')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id);

  if (galleryError) {
    logger.error('[Galleries] Error restoring gallery:', galleryError);
    return NextResponse.json({ error: 'Failed to restore gallery' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Gallery restored.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params

  // First, verify the user owns this gallery (either as photographer or as client/user)
  const { data: gallery, error: fetchError } = await supabase
    .from('photo_galleries')
    .select('id, photographer_id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !gallery) {
    logger.error('[Galleries] Gallery not found:', fetchError);
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Check ownership: user must be either the photographer OR the user_id owner
  const isPhotographer = gallery.photographer_id === user.id;
  const isOwner = gallery.user_id === user.id;

  if (!isPhotographer && !isOwner) {
    logger.error('[Galleries] Unauthorized delete attempt:', { userId: user.id, gallery });
    return NextResponse.json({ error: 'You do not have permission to delete this gallery' }, { status: 403 });
  }

  // The trigger in the database will handle the soft delete.
  // We just need to execute a DELETE command, and the trigger will intercept it.
  const { error } = await supabase
    .from('photo_galleries')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[Galleries] Error soft deleting gallery:', error);

    // Check for foreign key constraint (gallery has active subscription)
    if (error.code === '23503' && error.message?.includes('subscriptions')) {
      return NextResponse.json(
        { error: 'Cannot delete gallery with active subscription. Please cancel the subscription first.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Gallery moved to recently deleted.' });
}
