import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/app-layout";

// Pages
import Landing from "@/pages/landing";
import Photos from "@/pages/photos";
import PhotoDetail from "@/pages/photo-detail";
import Albums from "@/pages/albums";
import AlbumDetail from "@/pages/album-detail";
import Favorites from "@/pages/favorites";
import Archive from "@/pages/archive";
import Trash from "@/pages/trash";
import Search from "@/pages/search";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim.
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(24 10% 10%)",
    colorForeground: "hsl(20 14% 10%)",       
    colorMutedForeground: "hsl(25 5% 45%)",  
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",       
    colorInput: "hsl(40 10% 90%)",            
    colorInputForeground: "hsl(20 14% 10%)",  
    colorNeutral: "hsl(40 10% 90%)",          
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border/50 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-display font-medium tracking-tight",
    headerSubtitle: "text-muted-foreground font-light",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive-foreground",
    logoBox: "w-12 h-12 mx-auto",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border border-border hover:bg-secondary/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full",
    formFieldInput: "bg-secondary border-transparent focus:border-primary rounded-xl",
    footerAction: "mt-4",
    dividerLine: "bg-border",
    alert: "bg-destructive border-0",
    otpCodeFieldInput: "border-border focus:border-primary rounded-xl",
    formFieldRow: "space-y-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/photos" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your memory vault",
          },
        },
        signUp: {
          start: {
            title: "Create your vault",
            subtitle: "Your personal, private photo collection",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="app-theme">
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/photos"><ProtectedRoute component={Photos} /></Route>
            <Route path="/photos/:id"><ProtectedRoute component={PhotoDetail} /></Route>
            <Route path="/albums"><ProtectedRoute component={Albums} /></Route>
            <Route path="/albums/:id"><ProtectedRoute component={AlbumDetail} /></Route>
            <Route path="/favorites"><ProtectedRoute component={Favorites} /></Route>
            <Route path="/archive"><ProtectedRoute component={Archive} /></Route>
            <Route path="/trash"><ProtectedRoute component={Trash} /></Route>
            <Route path="/search"><ProtectedRoute component={Search} /></Route>
            <Route path="/settings"><ProtectedRoute component={Settings} /></Route>

            {/* Default to 404 / redirect */}
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
