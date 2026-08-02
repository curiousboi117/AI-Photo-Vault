import { Link, useLocation } from "wouter";
import { Image as ImageIcon, LayoutGrid, Heart, Archive, Trash2, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetPhotoStats } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useGetPhotoStats();

  const navItems = [
    { href: "/photos", label: "Photos", icon: ImageIcon },
    { href: "/albums", label: "Albums", icon: LayoutGrid },
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/archive", label: "Archive", icon: Archive },
    { href: "/trash", label: "Trash", icon: Trash2 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen flex flex-col fixed left-0 top-0 z-10 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/photos" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={import.meta.env.BASE_URL + "logo.svg"} alt="Logo" className="w-6 h-6 text-foreground" />
          <span className="font-display font-medium text-lg tracking-tight">Memories</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {stats && (
        <div className="p-6 border-t border-border">
          <div className="text-xs font-medium text-sidebar-foreground mb-2 flex justify-between">
            <span>Storage</span>
            <span>{Math.round(stats.totalStorageBytes / (1024 * 1024 * 1024))} GB / 15 GB</span>
          </div>
          <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${Math.min(100, (stats.totalStorageBytes / (15 * 1024 * 1024 * 1024)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
