import { AdminBookForm } from "@/components/AdminBookForm";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AdminBookForm />
        </div>
      </main>
    </div>
  );
}
