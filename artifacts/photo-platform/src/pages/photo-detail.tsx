import { useGetPhoto, useUpdatePhoto, useDeletePhoto, getGetPhotoTimelineQueryKey, getListPhotosQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Heart, Archive, Trash2, Info, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function PhotoDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInfo, setShowInfo] = useState(false);

  const { data: photo, isLoading } = useGetPhoto(Number(id), {
    query: { enabled: !!id, queryKey: ['/api/photos', Number(id)] }
  });

  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();

  const handleToggleFavorite = async () => {
    if (!photo) return;
    await updatePhoto.mutateAsync({
      id: photo.id,
      data: { isFavorited: !photo.isFavorited }
    });
    queryClient.invalidateQueries({ queryKey: ['/api/photos', photo.id] });
    queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
  };

  const handleToggleArchive = async () => {
    if (!photo) return;
    await updatePhoto.mutateAsync({
      id: photo.id,
      data: { isArchived: !photo.isArchived }
    });
    queryClient.invalidateQueries({ queryKey: ['/api/photos', photo.id] });
    queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPhotoTimelineQueryKey() });
    
    if (!photo.isArchived) {
      toast({ description: "Photo archived" });
      setLocation("/photos");
    }
  };

  const handleDelete = async () => {
    if (!photo) return;
    if (confirm("Move to trash?")) {
      await deletePhoto.mutateAsync({ id: photo.id });
      queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPhotoTimelineQueryKey() });
      toast({ description: "Moved to trash" });
      setLocation("/photos");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <p>Photo not found.</p>
        <Button variant="ghost" onClick={() => setLocation("/photos")} className="ml-4">Go Back</Button>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-3xl z-50 flex animate-in fade-in duration-300">
      <div className="flex-1 relative flex flex-col">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10 text-white">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleToggleFavorite}>
              <Heart className={cn("w-5 h-5 transition-colors", photo.isFavorited ? "fill-red-500 text-red-500" : "")} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleToggleArchive}>
              <Archive className={cn("w-5 h-5", photo.isArchived && "fill-white/30")} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleDelete}>
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowInfo(!showInfo)}>
              <Info className={cn("w-5 h-5", showInfo && "fill-white/30")} />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-8">
          <img 
            src={`/api/storage${photo.objectPath}`} 
            alt={photo.filename} 
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl drop-shadow-2xl" 
          />
        </div>
      </div>

      {/* Info Sidebar */}
      {showInfo && (
        <div className="w-80 bg-card border-l border-border flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-medium text-lg">Details</h3>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Filename</p>
              <p className="text-sm font-medium break-all">{photo.filename}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm">{new Date(photo.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Size</p>
                <p className="text-sm">{formatBytes(photo.fileSize)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resolution</p>
                <p className="text-sm">{photo.width} × {photo.height}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm">{photo.mimeType}</p>
              </div>
            </div>

            {photo.albums && photo.albums.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Albums</p>
                <div className="flex flex-wrap gap-2">
                  {photo.albums.map(a => (
                    <span key={a.id} className="text-xs bg-secondary px-2 py-1 rounded-md">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
