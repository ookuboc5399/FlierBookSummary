import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const formSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください"),
  preferredCategories: z.array(z.string()),
  preferredTags: z.array(z.string()),
  emailNotifications: z.boolean(),
  darkMode: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useUser();
  const [, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      preferredCategories: user?.preferredCategories || [],
      preferredTags: user?.preferredTags || [],
      emailNotifications: user?.emailNotifications ?? true,
      darkMode: user?.darkMode ?? false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile(values);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">プロファイル設定</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>プロファイル情報</CardTitle>
              <CardDescription>
                あなたのプロフィール情報とアプリの設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>表示名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center">
                        <div>
                          <FormLabel>メール通知</FormLabel>
                          <CardDescription>
                            新しい要約や更新の通知を受け取る
                          </CardDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center">
                        <div>
                          <FormLabel>ダークモード</FormLabel>
                          <CardDescription>
                            ダークテーマを使用する
                          </CardDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    設定を保存
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
