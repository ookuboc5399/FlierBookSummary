import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/lib/theme";

function Router() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user && location !== "/auth") {
    return <AuthPage />;
  }

  if (user?.isAdmin && location === "/admin") {
    return <AdminPage />;
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/" component={HomePage} />
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
