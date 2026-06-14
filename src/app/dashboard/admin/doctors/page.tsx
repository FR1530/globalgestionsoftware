import prisma from "@/lib/db/prisma";
import { DoctorsPageClient } from "./DoctorsPageClient";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { id: true, email: true } },
      availabilities: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedDoctors = doctors.map(d => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    deletedAt: d.deletedAt?.toISOString() ?? null,
    availabilities: d.availabilities.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  }));

  return <DoctorsPageClient doctors={serializedDoctors} />;
}
