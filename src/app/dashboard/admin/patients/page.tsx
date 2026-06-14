import prisma from "@/lib/db/prisma";
import { PatientsPageClient } from "./PatientsPageClient";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = patients.map((p) => ({
    ...p,
    birthDate: p.birthDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
  }));

  return <PatientsPageClient patients={serialized} />;
}
