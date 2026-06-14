"use client";

import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  adminCreateAppointment,
  adminUpdateAppointment,
  adminDeleteAppointment,
} from "@/features/appointments/adminActions";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  rescheduledFromId: string | null;
  patient: { id: string; firstName: string; lastName: string };
  doctor: { id: string; firstName: string; lastName: string; specialty: string };
};
type Patient = { id: string; firstName: string; lastName: string };
type Doctor = { id: string; firstName: string; lastName: string; specialty: string };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// ─── Appointment Form Modal ─────────────────────────────────────────────────
function AppointmentFormModal({
  editing,
  patients,
  doctors,
  onClose,
}: {
  editing: Appointment | null;
  patients: Patient[];
  doctors: Doctor[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!editing;

  const [patientId, setPatientId] = useState(editing?.patient.id ?? "");
  const [doctorId, setDoctorId] = useState(editing?.doctor.id ?? "");
  const [startTime, setStartTime] = useState(
    editing ? new Date(editing.startTime).toISOString().slice(0, 16) : ""
  );
  const [status, setStatus] = useState(editing?.status ?? "PENDING");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!patientId || !doctorId || !startTime) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await adminUpdateAppointment(editing.id, {
          patientId, doctorId, startTime, status: status as any,
        });
      } else {
        await adminCreateAppointment({ patientId, doctorId, startTime, status: status as any });
      }
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditing ? "Editar Turno" : "Nuevo Turno"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Paciente</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)} required className={selectClass}>
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Médico</label>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required className={selectClass}>
              <option value="">Seleccionar médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha y hora de inicio</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              className={selectClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Turno"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function DeleteConfirmModal({
  appointment,
  onClose,
  onConfirmed,
}: {
  appointment: Appointment;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const expectedName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  const matches = input.trim().toLowerCase() === expectedName.toLowerCase();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminDeleteAppointment(appointment.id);
      router.refresh();
      onConfirmed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar turno</h2>
            <p className="text-sm text-slate-500 mt-1">
              Esta acción cancelará y eliminará el turno de{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{expectedName}</span> del{" "}
              <span className="font-semibold">{format(new Date(appointment.startTime), "dd/MM/yyyy 'a las' HH:mm")}</span>.
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Para confirmar, escribí el nombre completo del paciente:
          </label>
          <p className="text-xs text-slate-400 mb-2 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {expectedName}
          </p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribí el nombre aquí..."
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-400 outline-none"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={handleDelete}
            disabled={!matches || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
          >
            {loading ? "Eliminando..." : "Confirmar eliminación"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AppointmentsPageClient({
  appointments,
  patients,
  doctors,
}: {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [deletingAppt, setDeletingAppt] = useState<Appointment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        `${a.patient.firstName} ${a.patient.lastName} ${a.doctor.firstName} ${a.doctor.lastName} ${a.doctor.specialty}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, search, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Turnos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {appointments.length} turno{appointments.length !== 1 ? "s" : ""} en el sistema
          </p>
        </div>
        <Button onClick={() => { setEditingAppt(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, médico o especialidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Médico</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {search || statusFilter ? "Sin resultados para los filtros aplicados." : "No hay turnos registrados."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div>{format(new Date(a.startTime), "dd/MM/yyyy", { locale: es })}</div>
                      <div className="text-xs text-slate-400">{format(new Date(a.startTime), "HH:mm")} — {format(new Date(a.endTime), "HH:mm")}</div>
                    </td>
                    <td className="px-6 py-4">{a.patient.firstName} {a.patient.lastName}</td>
                    <td className="px-6 py-4">
                      <div>Dr. {a.doctor.firstName} {a.doctor.lastName}</div>
                      <div className="text-xs text-slate-400">{a.doctor.specialty}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                      {a.rescheduledFromId && (
                        <span className="ml-2 text-xs text-slate-400 italic">reprogramado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingAppt(a); setShowForm(true); }}>
                          <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingAppt(a)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <AppointmentFormModal
          editing={editingAppt}
          patients={patients}
          doctors={doctors}
          onClose={() => { setShowForm(false); setEditingAppt(null); }}
        />
      )}
      {deletingAppt && (
        <DeleteConfirmModal
          appointment={deletingAppt}
          onClose={() => setDeletingAppt(null)}
          onConfirmed={() => setDeletingAppt(null)}
        />
      )}
    </div>
  );
}
