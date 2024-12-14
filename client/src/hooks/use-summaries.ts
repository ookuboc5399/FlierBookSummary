import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookWithSummary, CreateBookInput } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useSummaries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summaries, isLoading } = useQuery<BookWithSummary[]>({
    queryKey: ["/api/summaries"],
  });

  const createMutation = useMutation<{ ok: boolean }, Error, CreateBookInput>({
    mutationFn: async (data) => {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summaries"] });
      toast({
        title: "Success",
        description: "Book summary created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation<{ ok: boolean }, Error, number>({
    mutationFn: async (bookId) => {
      const response = await fetch(`/api/favorites/${bookId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summaries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    summaries,
    isLoading,
    createSummary: createMutation.mutateAsync,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
  };
}
