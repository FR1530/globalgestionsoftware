"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDoctor, updateDoctor } from "@/features/doctors/actions";
import { useRouter } from "next/navigation";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const SPECIALTIES = [
  "Cardiología",
  "Clínica Médica",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Infectología",
  "Kinesiología",
  "Medicina General",
  "Nefrología",
  "Neumología",
  "Neurología",
  "Nutrición",
  "Oftalmología",
  "Oncología",
  "Ortopedia y Traumatología",
  "Otorrinolaringología",
  "Pediatría",
  "Psicología",
  "Psiquiatría",
  "Reumatología",
  "Urología",
];

// Genera slots de tiempo cada 30 minutos de 07:00 a 21:00
const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

type Availability = { dayOfWeek: number; startTime: string; endTime: string };

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  appointmentDurationMinutes: number;
  availabilities: Availability[];
  userId: string;
};

type Props = {
  editingDoctor?: Doctor | null;
  onClose: () => void;
};

export function DoctorFormModal({ editingDoctor, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!editingDoctor;

  const [firstName, setFirstName] = useState(editingDoctor?.firstName ?? "");
  const [lastName, setLastName] = useState(editingDoctor?.lastName ?? "");
  const [specialty, setSpecialty] = useState(editingDoctor?.specialty ?? "");
  const [duration, setDuration] = useState(editingDoctor?.appointmentDurationMinutes ?? 30);
  // Sólo para creación
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [availabilities, setAvailabilities] = useState<Availability[]>(
    editingDoctor?.availabilities ?? []
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addSlot = () => {
    setAvailabilities([...availabilities, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (i: number) => {
    setAvailabilities(availabilities.filter((_, idx) => idx !== i));
  };

  const updateSlot = (i: number, field: keyof Availability, value: string | number) => {
    setAvailabilities(availabilities.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    for (const a of availabilities) {
      if (a.startTime >= a.endTime) {
        setError(`${DAYS[a.dayOfWeek]}: la hora de inicio debe ser menor a la de fin.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateDoctor(editingDoctor.id, {
          firstName, lastName, specialty,
          appointmentDurationMinutes: duration,
          availabilities,
        });
      } else {
        if (!email || !password) {
          setError("El email y la contraseña son obligatorios.");
          setLoading(false);
          return;
        }
        await createDoctor({
          email, password, firstName, lastName, specialty,
          appointmentDurationMinutes: duration,
          availabilities,
        });
      }
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm";
  const selectClass = inputClass;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditing ? `Editar: Dr. ${editingDoctor.firstName} ${editingDoctor.lastName}` : "Nuevo Médico"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cuenta de acceso — solo al crear */}
          {!isEditing && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Cuenta de acceso al sistema
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                  <input
                    type="email" value={email} required={!isEditing}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="dr.garcia@clinica.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Contraseña inicial</label>
                  <input
                    type="password" value={password} required={!isEditing} minLength={6}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} placeholder="Juan" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Apellido</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} required className={inputClass} placeholder="García" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Especialidad</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} required className={selectClass}>
                <option value="">Seleccionar especialidad...</option>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Duración del turno</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={selectClass}>
                {[15, 20, 30, 45, 60, 90].map(m => (
                  <option key={m} value={m}>{m} minutos</option>
                ))}
              </select>
            </div>
          </div>

          {/* Disponibilidades */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Horarios de disponibilidad</p>
                <p className="text-xs text-slate-400">Definí en qué días y horarios atiende el médico</p>
              </div>
              <button
                type="button" onClick={addSlot}
                className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar franja
              </button>
            </div>

            {availabilities.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-400">Sin horarios configurados</p>
                <button type="button" onClick={addSlot} className="mt-2 text-indigo-600 text-xs font-medium hover:underline">
                  + Agregar primer franja horaria
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availabilities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <select
                      value={a.dayOfWeek}
                      onChange={e => updateSlot(i, "dayOfWeek", Number(e.target.value))}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none min-w-[110px]"
                    >
                      {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                    </select>

                    <span className="text-xs text-slate-400 font-medium">de</span>

                    <select
                      value={a.startTime}
                      onChange={e => updateSlot(i, "startTime", e.target.value)}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <span className="text-xs text-slate-400 font-medium">a</span>

                    <select
                      value={a.endTime}
                      onChange={e => updateSlot(i, "endTime", e.target.value)}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <button
                      type="button" onClick={() => removeSlot(i)}
                      className="ml-auto text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Médico"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
