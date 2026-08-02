import { useListPhotos } from "@workspace/api-client-react";
import { Loader2, Heart } from "lucide-react";
import { PhotoGrid } from "@/components/photo-grid";

export default function Favorites() {
  const { data, isLoading } = useListPhotos({ favorited: true, limit: 200 });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-display font-medium tracking-tight">Favorites</h1>
      </div>

      {!data || data.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 border border-border/50">
            <Heart className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-2">No favorites</h2>
          <p className="text-muted-foreground">Click the heart icon on any photo to add it to your favorites.</p>
        </div>
      ) : (
        <PhotoGrid photos={data.photos} />
      )}
    </div>
  );
}
