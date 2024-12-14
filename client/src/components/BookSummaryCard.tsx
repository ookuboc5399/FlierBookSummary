import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, PlayCircle } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { useState } from "react";
import type { BookWithSummary } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  book: BookWithSummary;
  onToggleFavorite: () => void;
}

export function BookSummaryCard({ book, onToggleFavorite }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{book.title}</CardTitle>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className={cn(
              "p-3 sm:p-2",
              book.isFavorite && "text-red-500"
            )}
          >
            <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm flex-1">{book.summary?.content}</p>
        {book.summary?.audioUrl && (
          <div className="mt-4">
            {isPlaying ? (
              <AudioPlayer
                url={book.summary.audioUrl}
                onClose={() => setIsPlaying(false)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPlaying(true)}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Listen
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
