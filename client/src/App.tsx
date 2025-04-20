import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Game from "@/pages/Game";
import Lobby from "@/pages/Lobby";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Lobby} />
      <Route path="/game/:id" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
        <Router />
      </div>
    </TooltipProvider>
  );
}

export default App;
