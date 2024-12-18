import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../components/ui/form";
import { useToast } from "../components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "../hooks/use-auth";

const formSchema = z.object({
  email: z.string()
    .email("メールアドレスの形式が正しくありません")
    .superRefine((value, ctx) => {
      console.log('Validating email:', value);
      // Admin validation - must use proper email format
      if (value === 'admin@admin.flier.local') {
        console.log('Admin validation passed');
        return;
      }
      // Additional email validation if needed
      if (!value.includes('@')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "メールアドレスに@をつけてください",
        });
      }
    }),
  password: z.string()
    .min(8, "パスワードは8文字以上である必要があります。")
});

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { isAdmin } = await signIn(values.email, values.password);

      toast({
        title: "ログイン成功",
        description: isAdmin ? "管理者としてログインしました。" : "ログインしました。",
      });

      // Navigate based on user role
      setLocation(isAdmin ? '/admin' : '/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "ログインエラー",
        description: "メールアドレスまたはパスワードが正しくありません。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Flier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full">
                ログイン / 新規登録
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
