"use server";

import prisma from "@/lib/db/prisma";

export async function getDashboardStats() {
  const [
    activeDoctorsCount,
    registeredPatientsCount,
  ] = await Promise.all([
    prisma.doctor.count({ where: { deletedAt: null } }),
    prisma.patient.count({ where: { deletedAt: null } })
  ]);

  // Turnos por estado global (para gráfico de torta)
  const appointmentsByStatusRaw = await prisma.appointment.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
    where: { deletedAt: null }
  });

  const appointmentsByStatus = appointmentsByStatusRaw.map((item) => ({
    name: item.status,
    value: item._count.id,
  }));

  // Turnos creados por mes en el año actual (para gráfico de barras)
  // Nota: Esto agrupa por la fecha de creación (createdAt). También se podría agrupar por startTime.
  // Aquí usamos la consulta en crudo segura (Raw) o extraemos desde la base a memoria si no hay millones de datos.
  // Como estamos en SQLite/Postgres de manera agnóstica para el ORM sin Raw, lo hacemos en memoria por simplicidad
  // o usamos una aproximación basada en rangos.
  
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const appointmentsThisYear = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      startTime: {
        gte: startOfYear,
        lte: endOfYear,
      }
    },
    select: {
      startTime: true,
      status: true,
    }
  });

  const monthsArray = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    count: 0
  }));

  appointmentsThisYear.forEach(app => {
    const month = app.startTime.getMonth(); // 0 - 11
    monthsArray[month].count += 1;
  });

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  const appointmentsByMonth = monthsArray.map(m => ({
    name: monthNames[m.month],
    turnos: m.count,
  }));

  // Turnos del día actual
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const todayAppointmentsCount = await prisma.appointment.count({
    where: {
      deletedAt: null,
      startTime: {
        gte: todayStart,
        lte: todayEnd,
      }
    }
  });

  return {
    activeDoctorsCount,
    registeredPatientsCount,
    todayAppointmentsCount,
    appointmentsByStatus,
    appointmentsByMonth
  };
}
