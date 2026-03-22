import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <ProfileForm user={user} />
    </AppShell>
  );
}

