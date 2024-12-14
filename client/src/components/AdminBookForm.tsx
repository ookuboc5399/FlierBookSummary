import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSummaries } from "@/hooks/use-summaries";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  author: z.string().min(1, "著者名を入力してください"),
  coverUrl: z.string().url().optional(),
  summary: z.string().min(100, "要約は100文字以上入力してください"),
});

export function AdminBookForm() {
  const { createSummary } = useSummaries();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      coverUrl: "",
      summary: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createSummary(values);
      form.reset();
    } catch (error) {
      console.error('Error creating summary:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input placeholder="本のタイトルを入力してください" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>著者</FormLabel>
              <FormControl>
                <Input placeholder="著者名を入力してください" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>表紙画像URL（任意）</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/book-cover.jpg" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>要約</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="本の内容を要約して入力してください（100文字以上）" 
                  {...field} 
                  rows={10}
                  className="min-h-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              処理中...
            </>
          ) : (
            "要約を作成"
          )}
        </Button>
      </form>
    </Form>
  );
}
