import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      ></div>
      
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="mb-8 w-16 h-16 opacity-80">
          <img src={import.meta.env.BASE_URL + "logo.svg"} alt="Logo" className="w-full h-full text-foreground" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight mb-6">
          A quiet place for your photos.
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-xl font-light">
          Beautiful, personal, and strictly yours. Rediscover your memories without the noise.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/sign-up" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium text-lg hover:scale-105 transition-transform w-full sm:w-auto">
            Start your vault
          </Link>
          <Link href="/sign-in" className="bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-medium text-lg hover:bg-secondary/80 transition-colors w-full sm:w-auto">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
