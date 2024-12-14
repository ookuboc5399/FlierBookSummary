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
  title: z.string().min(1),
  author: z.string().min(1),
  coverUrl: z.string().url().optional(),
  summary: z.string().min(100),
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
    await createSummary(values);
    form.reset();
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
                <Input placeholder="本のタイトルを入力" {...field} />
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
                <Input placeholder="著者名を入力" {...field} />
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
                <Input placeholder="https://example.com/book-cover.jpg" {...field} />
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
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "要約を作成"
          )}
        </Button>
      </form>
    </Form>
  );
}
