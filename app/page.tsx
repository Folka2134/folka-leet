import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // This is now safe because the middleware has already refreshed the session
  const { data } = await supabase.auth.getSession();

  // Redirect based on authentication status
  if (data.session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }

  // This will never be rendered
  return null;
}
