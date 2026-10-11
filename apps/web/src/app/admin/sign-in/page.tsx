import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSignInForm } from "@/components/admin/sign-in-form";
import { Logo } from "@/components/site/logo";
import { Card } from "@/components/ui";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminSignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(ADMIN_HOME);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Logo />
      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Staff sign in</h1>
          <p className="mt-1 text-on-surface-variant">We will text a 6-digit code to your phone.</p>
        </div>
        <AdminSignInForm />
      </Card>
    </main>
  );
}
