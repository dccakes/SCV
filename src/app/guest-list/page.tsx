import { api } from "~/trpc/server";
import { redirect } from "next/navigation";
import { sharedStyles } from "../utils/shared-styles";
import { Suspense } from "react";

import GuestList from "../_components/guest-list";

export default async function DashboardPage() {
  const dashboardData = await api.dashboard.getByUserId.query();

  if (dashboardData === null) {
    redirect("/");
  }

  return (
    <main className={`${sharedStyles.desktopPaddingSidesGuestList}`}>
      <Suspense fallback={<div>Loading guest list...</div>}>
        <GuestList dashboardData={dashboardData} />
      </Suspense>
    </main>
  );
}
