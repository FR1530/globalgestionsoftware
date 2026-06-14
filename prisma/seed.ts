import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: { deletedAt: null },
    create: {
      email: 'admin@system.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  // Doctor
  const doctorPasswordHash = await bcrypt.hash('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@system.com' },
    update: { deletedAt: null },
    create: {
      email: 'doctor@system.com',
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      doctor: {
        create: {
          firstName: 'Juan',
          lastName: 'Pérez',
          specialty: 'Cardiología',
          appointmentDurationMinutes: 30,
        },
      },
    },
    include: { doctor: true },
  });

  // Agregar disponibilidades al médico seed si no las tiene
  if (doctorUser.doctor) {
    const existingAvailabilities = await prisma.doctorAvailability.count({
      where: { doctorId: doctorUser.doctor.id },
    });
    if (existingAvailabilities === 0) {
      await prisma.doctorAvailability.createMany({
        data: [
          { doctorId: doctorUser.doctor.id, dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }, // Lun
          { doctorId: doctorUser.doctor.id, dayOfWeek: 1, startTime: '14:00', endTime: '18:00' }, // Lun tarde
          { doctorId: doctorUser.doctor.id, dayOfWeek: 3, startTime: '08:00', endTime: '12:00' }, // Mié
          { doctorId: doctorUser.doctor.id, dayOfWeek: 5, startTime: '09:00', endTime: '13:00' }, // Vie
        ],
      });
      console.log('  → Disponibilidades del médico creadas (Lun, Mié, Vie)');
    }
  }

  // Patient
  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  await prisma.user.upsert({
    where: { email: 'patient@system.com' },
    update: { deletedAt: null },
    create: {
      email: 'patient@system.com',
      passwordHash: patientPasswordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          firstName: 'María',
          lastName: 'Gómez',
          phone: '+5491112345678',
        },
      },
    },
  });

  console.log('✅ Seed completado.');
  console.log('   admin@system.com  / admin123');
  console.log('   doctor@system.com / doctor123  (atiende Lun, Mié, Vie)');
  console.log('   patient@system.com / patient123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
