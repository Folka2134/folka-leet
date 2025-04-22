import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage() {
  // Create a new supabase server client on every request
  // (important for handling cookies correctly)
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // This is now safe because the middleware has already refreshed the session
  const { data } = await supabase.auth.getSession();

  // If authenticated, redirect to dashboard
  if (data.session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <AuthForm />
    </div>
  );
}
