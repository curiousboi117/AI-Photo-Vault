import { Link } from "wouter";
import type { Photo } from "@workspace/api-client-react";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {photos.map((photo) => (
        <Link 
          href={`/photos/${photo.id}`} 
          key={photo.id} 
          className="block group relative overflow-hidden rounded-xl break-inside-avoid bg-secondary"
        >
          <img 
            src={`/api/storage${photo.thumbnailPath || photo.objectPath}`} 
            alt={photo.filename} 
            loading="lazy" 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </Link>
      ))}
    </div>
  );
}
