import { useGetAlbum, useUpdateAlbum, useDeleteAlbum, useAddPhotosToAlbum, useRemovePhotoFromAlbum, getListAlbumsQueryKey, getGetAlbumQueryKey, useListPhotos } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Loader2, Trash2, Edit3, ImagePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoGrid } from "@/components/photo-grid";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AlbumDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: album, isLoading } = useGetAlbum(Number(id), {
    query: { enabled: !!id, queryKey: getGetAlbumQueryKey(Number(id)) }
  });

  const updateAlbum = useUpdateAlbum();
  const deleteAlbum = useDeleteAlbum();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleDelete = async () => {
    if (!album) return;
    if (confirm("Delete this album? The photos will remain in your library.")) {
      await deleteAlbum.mutateAsync({ id: album.id });
      queryClient.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
      toast({ description: "Album deleted" });
      setLocation("/albums");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album || !name.trim()) return;
    await updateAlbum.mutateAsync({
      id: album.id,
      data: { name, description }
    });
    queryClient.invalidateQueries({ queryKey: getGetAlbumQueryKey(album.id) });
    queryClient.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
    setIsOpen(false);
  };

  const openEdit = () => {
    if (album) {
      setName(album.name);
      setDescription(album.description || "");
      setIsEditOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="mb-4">Album not found</p>
        <Button onClick={() => setLocation("/albums")} variant="outline">Back to Albums</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <button onClick={() => history.back()} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-4xl font-display font-medium tracking-tight">{album.name}</h1>
          {album.description && <p className="text-muted-foreground text-lg">{album.description}</p>}
          <p className="text-sm text-muted-foreground font-medium">{album.photoCount} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={openEdit} className="rounded-full w-10 h-10">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} className="rounded-full w-10 h-10 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {album.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border-2 border-dashed border-border rounded-3xl bg-secondary/30">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <ImagePlus className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-medium mb-2">Album is empty</h3>
          <p className="text-muted-foreground">Go to your photos to add them to this album.</p>
        </div>
      ) : (
        <PhotoGrid photos={album.photos} />
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit album</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!name.trim() || updateAlbum.isPending}>
                {updateAlbum.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
