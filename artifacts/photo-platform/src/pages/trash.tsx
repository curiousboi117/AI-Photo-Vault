import { useListTrash, useEmptyTrash, useRestorePhoto, usePermanentlyDeletePhoto, getListTrashQueryKey, getListPhotosQueryKey, getGetPhotoStatsQueryKey, getGetPhotoTimelineQueryKey } from "@workspace/api-client-react";
import { Loader2, Trash2, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Trash() {
  const { data, isLoading } = useListTrash({ query: { queryKey: getListTrashQueryKey() }});
  const emptyTrash = useEmptyTrash();
  const restorePhoto = useRestorePhoto();
  const permDeletePhoto = usePermanentlyDeletePhoto();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEmptyTrash = async () => {
    if (confirm("Permanently delete all items in trash? This cannot be undone.")) {
      await emptyTrash.mutateAsync({});
      queryClient.invalidateQueries({ queryKey: getListTrashQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPhotoStatsQueryKey() });
      toast({ description: "Trash emptied" });
    }
  };

  const handleRestore = async (id: number) => {
    await restorePhoto.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListTrashQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPhotoTimelineQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPhotoStatsQueryKey() });
    toast({ description: "Photo restored" });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Permanently delete this photo?")) {
      await permDeletePhoto.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListTrashQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPhotoStatsQueryKey() });
      toast({ description: "Photo permanently deleted" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-medium tracking-tight">Trash</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Items in trash are automatically deleted after 30 days
          </p>
        </div>
        {data && data.photos.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash} disabled={emptyTrash.isPending} className="rounded-full px-6">
            {emptyTrash.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Empty Trash
          </Button>
        )}
      </div>

      {!data || data.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 border border-border/50">
            <Trash2 className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-2">Trash is empty</h2>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {data.photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl break-inside-avoid bg-secondary">
              <img 
                src={`/api/storage${photo.thumbnailPath || photo.objectPath}`} 
                alt={photo.filename} 
                loading="lazy" 
                className="w-full h-auto object-cover opacity-60 grayscale-[50%]" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
                <Button size="icon" variant="secondary" onClick={() => handleRestore(photo.id)} title="Restore" className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/40 border-0 text-white">
                  <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(photo.id)} title="Delete permanently" className="rounded-full w-10 h-10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
