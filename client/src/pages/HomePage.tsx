import { BookSummaryCard } from "@/components/BookSummaryCard";
import { useSummaries } from "@/hooks/use-summaries";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export default function HomePage() {
  const { summaries, isLoading, toggleFavorite } = useSummaries();
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Flier
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              {user?.isAdmin && (
                <Button variant="outline" asChild>
                  <a href="/admin">管理パネル</a>
                </Button>
              )}
              <Button variant="outline" asChild>
                <a href="/profile">プロファイル</a>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Book Summaries</h2>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* おすすめの本 */}
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">おすすめの本</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {summaries
                  ?.filter(book => (book.recommendationScore ?? 0) > 0)
                  .slice(0, 3)
                  .map((book) => (
                    <BookSummaryCard
                      key={book.id}
                      book={book}
                      onToggleFavorite={() => toggleFavorite(book.id)}
                    />
                  ))}
              </div>
            </div>

            {/* 全ての本 */}
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">全ての本</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {summaries?.map((book) => (
                  <BookSummaryCard
                    key={book.id}
                    book={book}
                    onToggleFavorite={() => toggleFavorite(book.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
