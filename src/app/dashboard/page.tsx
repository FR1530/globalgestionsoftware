import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (role === "DOCTOR") {
    redirect("/dashboard/doctor/agenda");
  } else if (role === "PATIENT") {
    redirect("/dashboard/patient/appointments");
  } else {
    redirect("/login");
  }
}
