import { useListAlbums, useCreateAlbum, getListAlbumsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Loader2, Plus, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Albums() {
  const { data: albums, isLoading } = useListAlbums();
  const createAlbum = useCreateAlbum();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newAlbum = await createAlbum.mutateAsync({
        data: { name, description }
      });
      queryClient.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
      toast({ title: "Album created" });
      setIsOpen(false);
      setName("");
      setDescription("");
      setLocation(`/albums/${newAlbum.id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to create album" });
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-medium tracking-tight">Albums</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2 px-5">
              <Plus className="w-4 h-4" /> Create Album
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Create new album</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Vacation" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="August 2024" />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!name.trim() || createAlbum.isPending}>
                  {createAlbum.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!albums || albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 border border-border/50">
            <LayoutGridIcon className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-2">No albums yet</h2>
          <p className="text-muted-foreground mb-6">Group your photos into albums to keep them organized.</p>
          <Button onClick={() => setIsOpen(true)} variant="outline" className="rounded-full">Create your first album</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album) => (
            <Link href={`/albums/${album.id}`} key={album.id} className="group cursor-pointer">
              <div className="aspect-square bg-secondary rounded-2xl mb-3 overflow-hidden relative border border-border/50 transition-shadow group-hover:border-primary/20">
                {album.coverObjectPath ? (
                  <img src={`/api/storage${album.coverObjectPath}`} alt={album.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>
              <h3 className="font-medium truncate px-1 text-foreground/90">{album.name}</h3>
              <p className="text-sm text-muted-foreground px-1">{album.photoCount} {album.photoCount === 1 ? 'item' : 'items'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Just to avoid missing import
import { LayoutGrid as LayoutGridIcon } from "lucide-react";
