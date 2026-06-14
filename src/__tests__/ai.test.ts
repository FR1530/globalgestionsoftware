import { describe, it, expect, vi } from 'vitest';
import { generatePatientMessageOnDemand } from '@/features/ai-messages/actions';
import { ai } from '@/lib/ai/groq';
import prisma from '@/lib/db/prisma';

// 1. Mockeamos la capa de BD para no intentar guardar
vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      aIInteraction: {
        create: vi.fn(),
      }
    }
  };
});

// 2. Mockeamos explícitamente el proveedor de IA para evitar llamadas reales
vi.mock('@/lib/ai/groq', () => {
  return {
    ai: {
      generateObject: vi.fn(),
    }
  };
});

describe('AI Module Integration', () => {
  it('debería mockear la IA sin pegarle a la API real y validar la estructura', async () => {
    // Configuramos el mock de la IA para que devuelva un string
    (ai.generateObject as any).mockResolvedValue({ message: "Mocked message" });
    
    const result = await generatePatientMessageOnDemand({
      userId: '1',
      patientName: 'Juan',
      doctorName: 'Perez',
      date: '2023-10-10',
      time: '15:00',
      type: 'reminder',
    });

    // Aseguramos que la llamada a la IA se haya realizado con el schema correcto
    expect(ai.generateObject).toHaveBeenCalled();
    const callArgs = (ai.generateObject as any).mock.calls[0];
    
    // Verificamos que el segundo argumento pasado a generateObject sea un Schema Zod válido (que tenga el método 'parse' o sea de tipo ZodObject)
    expect(callArgs[1]).toHaveProperty('parse');
    
    // Comprobamos que el resultado no sea de la API real
    expect(result).toBe("Mocked message");
    
    // Comprobamos que se registre en DB mockeada
    expect(prisma.aIInteraction.create).toHaveBeenCalled();
  });
});
