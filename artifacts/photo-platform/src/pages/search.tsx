import { useState, useEffect } from "react";
import { useSearchPhotos } from "@workspace/api-client-react";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { PhotoGrid } from "@/components/photo-grid";
import { Input } from "@/components/ui/input";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useSearchPhotos(
    { q: debouncedQuery, limit: 100 },
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 max-w-6xl mx-auto">
      <div className="sticky top-16 bg-background/95 backdrop-blur-xl z-20 py-6 -mx-6 px-6 border-b border-border/50">
        <div className="relative max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search by filename, tags, or AI descriptions..." 
            className="w-full pl-12 pr-4 py-6 rounded-2xl bg-secondary/50 border-transparent focus-visible:bg-background text-lg shadow-sm"
            autoFocus
          />
        </div>
      </div>

      {!debouncedQuery ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto opacity-60">
          <SearchIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-medium mb-2">Search your library</h2>
          <p className="text-sm text-muted-foreground">Find photos by what's in them, where they were taken, or their tags.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-muted-foreground">No results found for "{debouncedQuery}"</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-6 font-medium px-1">{data.total} results found</p>
          <PhotoGrid photos={data.photos} />
        </div>
      )}
    </div>
  );
}
