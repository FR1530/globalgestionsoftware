"use server";

import { ai } from "@/lib/ai/groq";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { AIFeature } from "@prisma/client";

const PatientMessageSchema = z.object({
  message: z.string().max(300).describe("Mensaje amigable y claro para el paciente"),
});

export async function generatePatientMessageOnDemand({
  userId,
  patientName,
  doctorName,
  date,
  time,
  type,
}: {
  userId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: "reminder" | "cancellation" | "reschedule";
}) {
  const promptMap = {
    reminder: `Genera un recordatorio amigable para el paciente ${patientName} sobre su turno con el Dr. ${doctorName} el día ${date} a las ${time}.`,
    cancellation: `Genera un mensaje respetuoso para el paciente ${patientName} informando que su turno con el Dr. ${doctorName} el día ${date} a las ${time} ha sido cancelado por razones de fuerza mayor. Sugiere que solicite un nuevo turno.`,
    reschedule: `Genera un mensaje informando al paciente ${patientName} que su turno original ha sido reprogramado para el día ${date} a las ${time} con el Dr. ${doctorName}. Pide disculpas por los inconvenientes.`,
  };

  const prompt = promptMap[type] + " Máximo 300 caracteres.";

  const result = await ai.generateObject(prompt, PatientMessageSchema);

  // Persistir la interacción en la base de datos para trazabilidad
  await prisma.aIInteraction.create({
    data: {
      userId,
      feature: AIFeature.PATIENT_MESSAGE,
      provider: "groq/llama-3.3-70b-versatile",
      inputSummary: `Generación on-demand de mensaje tipo ${type} para turno el ${date} a las ${time}`,
      outputJson: JSON.stringify(result), // SQLite almacena JSON como String
    },
  });

  return result.message;
}
