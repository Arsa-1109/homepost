/**
 * Landlord Dashboard
 *
 * Overview cards: properties, units, open requests, pending tenants.
 */

import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardBentoGrid } from "@/components/DashboardBentoGrid";

export default function LandlordDashboard() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader />
      <DashboardBentoGrid />
    </div>
  );
}
