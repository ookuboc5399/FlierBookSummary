import { useState, useEffect } from "react";
import { AdminBookForm } from "@/components/AdminBookForm";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !user.isAdmin && !initialized) {
      setInitialized(true);
      setLocation("/");
    }
  }, [user, initialized, setLocation]);

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">管理パネル</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold">新しい本の要約を追加</h2>
          <AdminBookForm />
        </div>
      </main>
    </div>
  );
}
