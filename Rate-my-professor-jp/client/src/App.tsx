import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/home"));
const Professor = lazy(() => import("@/pages/professor"));
const University = lazy(() => import("@/pages/university"));
const Admin = lazy(() => import("@/pages/admin"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/professor/:id" component={Professor} />
      <Route path="/university/:id" component={University} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<div>Loading...</div>}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
