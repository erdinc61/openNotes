import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { UIScaleSlider } from "@/components/UIScaleSlider";
import { LogoutButton } from "@/components/LogoutButton";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

      <div className="space-y-4">
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h2 className="font-medium text-foreground">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Dark mode</span>
            <DarkModeToggle />
          </div>
          <div className="space-y-1">
            <span className="text-sm text-foreground">UI Scale</span>
            <UIScaleSlider />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-2">
          <h2 className="font-medium text-foreground">Account</h2>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Email: </span>
            {session.user.email}
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-medium text-foreground">Session</h2>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
