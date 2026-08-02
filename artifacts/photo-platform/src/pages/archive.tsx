import { useListPhotos } from "@workspace/api-client-react";
import { Loader2, Archive as ArchiveIcon } from "lucide-react";
import { PhotoGrid } from "@/components/photo-grid";

export default function Archive() {
  const { data, isLoading } = useListPhotos({ archived: true, limit: 200 });

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
        <h1 className="text-3xl font-display font-medium tracking-tight">Archive</h1>
      </div>

      {!data || data.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 border border-border/50">
            <ArchiveIcon className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-2">Archive is empty</h2>
          <p className="text-muted-foreground">Photos you archive will appear here, hidden from your main timeline.</p>
        </div>
      ) : (
        <PhotoGrid photos={data.photos} />
      )}
    </div>
  );
}
