import { useUser, UserButton } from "@clerk/react";
import { UploadCloud, Loader2 } from "lucide-react";
import { useRef } from "react";
import { usePhotoUpload } from "@/hooks/use-photo-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = usePhotoUpload();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFile(files[i]);
        toast({
          title: "Uploaded successfully",
          description: files[i].name,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: files[i].name,
        });
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 justify-end">
      <div className="flex items-center gap-4">
        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Uploading... {progress}%</span>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
          accept="image/*"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          )}
        >
          <UploadCloud className="w-4 h-4" />
          Upload
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
          <UserButton 
            afterSignOutUrl={import.meta.env.BASE_URL}
            appearance={{
              elements: {
                avatarBox: "w-full h-full"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
