import { useGetPhotoTimeline } from "@workspace/api-client-react";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { PhotoGrid } from "@/components/photo-grid";

export default function Photos() {
  const timeline = useGetPhotoTimeline({ limit: 200 });

  console.log("Timeline hook:", timeline);
  console.log("Timeline data:", timeline.data);
  console.log("Timeline error:", timeline.error);

  const { data, isLoading } = timeline;

  if (data) {
    console.log("Data keys:", Object.keys(data));
    console.log("Groups:", (data as any).groups);
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 shadow-sm border border-border/50">
          <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <h2 className="text-3xl font-display font-medium mb-3">No photos yet</h2>
        <p className="text-muted-foreground text-lg">Upload your first memory to start building your collection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-24 animate-in fade-in duration-700">
      {data.groups.map(group => {
        // format date like "August 15, 2024" or "Today" if today
        const dateObj = new Date(group.date);
        const today = new Date();
        const isToday = dateObj.toDateString() === today.toDateString();
        
        return (
          <div key={group.date}>
            <div className="sticky top-[64px] bg-background/90 backdrop-blur-md py-4 z-10 -mx-6 px-6 mb-4 flex items-center border-b border-transparent data-[stuck]:border-border/50 transition-colors">
              <h3 className="text-xl font-display font-medium tracking-tight text-foreground/90">
                {isToday ? "Today" : dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            <PhotoGrid photos={group.photos} />
          </div>
        );
      })}
    </div>
  );
}
