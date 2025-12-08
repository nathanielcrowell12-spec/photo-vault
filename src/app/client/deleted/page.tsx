// src/app/client/deleted/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Undo, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface DeletedGallery {
  id: string;
  gallery_name: string;
  deleted_at: string;
  photo_count: number;
}

export default function RecentlyDeletedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deletedGalleries, setDeletedGalleries] = useState<DeletedGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchDeletedGalleries = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('photo_galleries')
          .select('id, gallery_name, deleted_at, photo_count')
          .eq('user_id', user.id)
          .eq('status', 'deleted')
          .order('deleted_at', { ascending: false });

        if (error) {
          console.error('Error fetching deleted galleries:', error);
        } else {
          setDeletedGalleries(data);
        }
        setIsLoading(false);
      };
      fetchDeletedGalleries();
    }
  }, [user]);

  const handleRestore = async (galleryId: string) => {
    const galleryName = deletedGalleries.find(g => g.id === galleryId)?.gallery_name || 'Gallery';

    // Optimistic UI update
    setDeletedGalleries(prev => prev.filter(g => g.id !== galleryId));

    const response = await fetch(`/api/galleries/${galleryId}`, {
      method: 'POST',
    });

    if (response.ok) {
      // Show success message
      setRestoreSuccess(galleryName);
      setTimeout(() => setRestoreSuccess(null), 5000);
    } else {
      // Revert if the API call fails
      // This is a simplified example; a more robust solution would re-fetch the data
      alert('Failed to restore gallery. Please try again.');
    }
  };
  
  const daysUntilDeletion = (deletedAt: string) => {
    const deletionDate = new Date(deletedAt);
    deletionDate.setDate(deletionDate.getDate() + 30);
    const today = new Date();
    const diffTime = deletionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-neutral-900 flex items-center justify-center"><div className="text-neutral-400">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900">
    <div className="container mx-auto py-12">
      {/* Success Message */}
      {restoreSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Undo className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Gallery Restored Successfully</h4>
            <p className="text-sm text-green-800">
              "{restoreSuccess}" has been restored and is now available in your gallery list.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-neutral-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-100">
            <Trash2 className="h-6 w-6" />
            Recently Deleted
          </CardTitle>
          <p className="text-sm text-neutral-400 mt-2">
            Deleted galleries are kept here for 30 days before being permanently removed.
            You can restore them at any time during this period.
          </p>
        </CardHeader>
        <CardContent>
          {deletedGalleries.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recently Deleted Items</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                When you delete galleries, they'll appear here for 30 days.
                After that, they'll be permanently removed and can't be recovered.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-1">
                    Items will be permanently deleted
                  </h4>
                  <p className="text-sm text-orange-800">
                    All items in this folder will be permanently removed after their countdown expires.
                    Once permanently deleted, galleries and photos cannot be recovered.
                  </p>
                </div>
              </div>

              {/* Deleted Galleries List */}
              <ul className="space-y-3">
                {deletedGalleries.map(gallery => {
                  const daysLeft = daysUntilDeletion(gallery.deleted_at);
                  const isUrgent = daysLeft <= 7;

                  return (
                    <li
                      key={gallery.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{gallery.gallery_name}</p>
                          {isUrgent && (
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {gallery.photo_count} {gallery.photo_count === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-sm flex items-center gap-1 ${
                          isUrgent ? 'text-red-600 font-semibold' : 'text-orange-600'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                          <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(gallery.id)}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          <Undo className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Bottom Info */}
              <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                <p>
                  Need help? Restored galleries will appear back in your gallery list immediately.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
