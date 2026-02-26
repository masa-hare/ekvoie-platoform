import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const SubmitOpinion = lazy(() => import("./pages/SubmitOpinion"));
const Opinions = lazy(() => import("./pages/Opinions"));
const OpinionDetail = lazy(() => import("./pages/OpinionDetail"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const SiteInsights = lazy(() => import("./pages/SiteInsights"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  useEffect(() => {
    // Prefetch all page chunks in the background after initial load
    const prefetch = () => {
      import("./pages/Opinions");
      import("./pages/SubmitOpinion");
      import("./pages/OpinionDetail");
      import("./pages/HowItWorks");
      import("./pages/About");
      import("./pages/SiteInsights");
      import("./pages/Analytics");
      import("./pages/AdminLogin");
      import("./pages/Admin");
      import("./pages/NotFound");
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 200);
    }
  }, []);

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/submit"} component={SubmitOpinion} />
        <Route path={"/opinions"} component={Opinions} />
        <Route path={"/opinions/:id"} component={OpinionDetail} />
        <Route path={"/how-it-works"} component={HowItWorks} />
        <Route path={"/about"} component={About} />
        <Route path={"/site-insights"} component={SiteInsights} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/admin/login"} component={AdminLogin} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
