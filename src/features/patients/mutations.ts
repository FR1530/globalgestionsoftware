"use server";

import prisma from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function createPatient(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Ya existe un usuario con ese email.");

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "PATIENT",
      },
    });

    return tx.patient.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      },
    });
  });

  revalidatePath("/dashboard/admin/patients");
  return result;
}

export async function updatePatient(id: string, data: {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
}) {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) throw new Error("Paciente no encontrado.");

  // Si cambió el email, verificar que no esté en uso por otro usuario
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== patient.userId) {
      throw new Error("Ese email ya está en uso por otro usuario.");
    }
    await prisma.user.update({
      where: { id: patient.userId },
      data: { email: data.email },
    });
  }

  const result = await prisma.patient.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
    },
  });

  revalidatePath("/dashboard/admin/patients");
  return result;
}


export async function deletePatient(id: string) {
  // Soft delete
  const result = await prisma.patient.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // También soft-delete al usuario asociado
  await prisma.user.update({
    where: { id: result.userId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/admin/patients");
  return result;
}
