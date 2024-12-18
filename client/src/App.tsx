import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/admin";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import useAuth from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/lib/theme";
import { AdminRoute } from "./components/AdminRoute";

function Router() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user && location !== "/auth") {
    return <Redirect to="/auth" />;
  }

  return (
    <Switch>
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile">
        {user ? <ProfilePage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/">
        {user ? <HomePage /> : <Redirect to="/auth" />}
      </Route>
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
