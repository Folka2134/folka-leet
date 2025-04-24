import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Header } from "@/components/header";
import { QuestionSearch } from "@/components/question-search";
import { DueQuestions } from "@/components/due-questions";
import { RevisionBank } from "@/components/revision-bank";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // This is now safe because the middleware has already refreshed the session
  const { data } = await supabase.auth.getSession();

  // If not authenticated, redirect to login
  if (!data.session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <p className="text-gray-400">
            Simplifying your LeetCode journey through spaced repetition
          </p>
        </div>

        <div className="grid gap-8">
          <QuestionSearch />

          <DueQuestions />

          <div className="mt-4 flex justify-center">
            <RevisionBank />
          </div>
        </div>
      </main>

      {/* <footer className="py-4 text-center text-gray-500 text-sm"> */}
      {/*   <div className="flex justify-center space-x-4 mb-2"> */}
      {/*     <a href="https://github.com" className="hover:text-white"> */}
      {/*       GitHub */}
      {/*     </a> */}
      {/*     <a href="https://linkedin.com" className="hover:text-white"> */}
      {/*       LinkedIn */}
      {/*     </a> */}
      {/*   </div> */}
      {/*   <p>Contact Me:</p> */}
      {/* </footer> */}
    </div>
  );
}
