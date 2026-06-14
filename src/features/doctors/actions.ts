"use server";

import prisma from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { DoctorAvailabilitiesSchema } from "@/schemas/doctor";

export type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
};

export async function createDoctor(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialty: string;
  appointmentDurationMinutes: number;
  availabilities: AvailabilityInput[];
}) {
  const parsedAvailabilities = DoctorAvailabilitiesSchema.parse(data.availabilities);

  // Verificar que el email no esté en uso
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("Ya existe un usuario con ese email.");

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "DOCTOR",
      },
    });

    const doctor = await tx.doctor.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        specialty: data.specialty,
        appointmentDurationMinutes: data.appointmentDurationMinutes,
        availabilities: {
          create: parsedAvailabilities.map(a => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
        },
      },
      include: { availabilities: true },
    });

    return doctor;
  });

  revalidatePath("/dashboard/admin/doctors");
  return result;
}


export async function updateDoctorAvailability(doctorId: string, availabilities: AvailabilityInput[]) {
  const parsedAvailabilities = DoctorAvailabilitiesSchema.parse(availabilities);

  const result = await prisma.$transaction(async (tx) => {
    // Eliminamos las disponibilidades actuales y creamos las nuevas (sincronización completa)
    await tx.doctorAvailability.deleteMany({
      where: { doctorId },
    });

    const newAvailabilities = await tx.doctorAvailability.createMany({
      data: parsedAvailabilities.map(a => ({
        doctorId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });

    return newAvailabilities;
  });

  revalidatePath("/dashboard/admin/doctors");
  return result;
}

export async function updateDoctor(doctorId: string, data: {
  firstName: string;
  lastName: string;
  specialty: string;
  appointmentDurationMinutes: number;
  availabilities: AvailabilityInput[];
}) {
  const parsedAvailabilities = DoctorAvailabilitiesSchema.parse(data.availabilities);

  const result = await prisma.$transaction(async (tx) => {
    const doctor = await tx.doctor.update({
      where: { id: doctorId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        specialty: data.specialty,
        appointmentDurationMinutes: data.appointmentDurationMinutes,
      },
    });

    await tx.doctorAvailability.deleteMany({ where: { doctorId } });
    await tx.doctorAvailability.createMany({
      data: parsedAvailabilities.map(a => ({
        doctorId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });

    return doctor;
  });

  revalidatePath("/dashboard/admin/doctors");
  return result;
}

