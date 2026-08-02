import { useGetUserStorageStats, useGetCurrentUser, useUpdateCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Loader2, Moon, Sun, Monitor, HardDrive, User, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClerk } from "@clerk/react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { data: stats, isLoading: statsLoading } = useGetUserStorageStats();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const updateUser = useUpdateCurrentUser();
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateUser.mutateAsync({ data: { displayName } });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ description: "Profile updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update profile" });
    }
  };

  if (statsLoading || userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and storage.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile */}
        <section className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-display font-medium">Profile</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={user?.email || ""} disabled className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <Button type="submit" disabled={updateUser.isPending || displayName === user?.displayName} className="rounded-full">
              {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save changes
            </Button>
          </form>
        </section>

        {/* Storage */}
        {stats && (
          <section className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-display font-medium">Storage</h2>
            </div>
            
            <div className="max-w-md space-y-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-3xl font-display font-medium">{formatBytes(stats.totalBytes)}</p>
                  <p className="text-muted-foreground text-sm">of {formatBytes(stats.limitBytes)} used</p>
                </div>
                <p className="text-sm font-medium">{stats.photoCount} photos</p>
              </div>
              
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (stats.totalBytes / stats.limitBytes) * 100)}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Monitor className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-display font-medium">Appearance</h2>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setTheme("light")}
              className={cn("flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3", theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
            >
              <Sun className="w-6 h-6" />
              <span className="font-medium">Light</span>
            </button>
            <button 
              onClick={() => setTheme("dark")}
              className={cn("flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3", theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
            >
              <Moon className="w-6 h-6" />
              <span className="font-medium">Dark</span>
            </button>
            <button 
              onClick={() => setTheme("system")}
              className={cn("flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3", theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
            >
              <Monitor className="w-6 h-6" />
              <span className="font-medium">System</span>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-8">
          <Button variant="destructive" onClick={() => signOut()} className="rounded-full px-8">
            Log out
          </Button>
        </section>
      </div>
    </div>
  );
}
