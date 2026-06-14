"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { doctorUpdateStatus, doctorSaveMedicalNote } from "@/features/doctors/doctorActions";
import { CheckCircle, XCircle, ClipboardCheck, ChevronDown, ChevronUp, User, Phone, Calendar, FileText } from "lucide-react";

type MedicalNote = { id: string; content: string } | null;
type Patient = { id: string; firstName: string; lastName: string; phone: string | null; birthDate: string | null };

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  patient: Patient;
  medicalNote: MedicalNote;
};

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

function AppointmentCard({ appt }: { appt: Appointment }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState(appt.medicalNote?.content ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  const changeStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    setError("");
    try {
      await doctorUpdateStatus(appt.id, newStatus as any);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    setError("");
    try {
      await doctorSaveMedicalNote(appt.id, noteText.trim());
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingNote(false);
    }
  };

  const canConfirm = appt.status === "PENDING";
  const canComplete = appt.status === "CONFIRMED";
  const canCancel = appt.status === "PENDING" || appt.status === "CONFIRMED";
  const isDone = appt.status === "COMPLETED" || appt.status === "CANCELLED";

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-all ${
      appt.status === "CANCELLED" ? "border-red-100 dark:border-red-900/40 opacity-60" : "border-slate-100 dark:border-slate-800"
    }`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {format(new Date(appt.startTime), "HH:mm")}–{format(new Date(appt.endTime), "HH:mm")}
              </span>
              <span className="text-sm text-slate-400">·</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {format(new Date(appt.startTime), "EEEE dd 'de' MMMM", { locale: es })}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status]}`}>
                {STATUS_LABELS[appt.status]}
              </span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {appt.patient.firstName} {appt.patient.lastName}
            </p>
            {appt.notes && (
              <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                📝 "{appt.notes}"
              </p>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Acciones rápidas */}
        {!isDone && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {canConfirm && (
              <Button
                size="sm"
                disabled={updatingStatus}
                onClick={() => changeStatus("CONFIRMED")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirmar
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                disabled={updatingStatus}
                onClick={() => changeStatus("COMPLETED")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Marcar como atendido
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="destructive"
                disabled={updatingStatus}
                onClick={() => {
                  if (confirm("¿Cancelar este turno?")) changeStatus("CANCELLED");
                }}
                className="gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {/* Datos del paciente */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Datos del paciente</p>
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              {appt.patient.firstName} {appt.patient.lastName}
            </div>
            {appt.patient.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {appt.patient.phone}
              </div>
            )}
            {appt.patient.birthDate && (
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                {format(new Date(appt.patient.birthDate), "dd/MM/yyyy")} (fecha de nacimiento)
              </div>
            )}
            {appt.notes && (
              <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="italic">"{appt.notes}"</span>
              </div>
            )}
          </div>

          {/* Nota clínica */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nota clínica</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={isDone && !noteText ? "No hay nota clínica registrada." : "Escribí observaciones, diagnóstico, indicaciones..."}
              rows={4}
              maxLength={2000}
              disabled={appt.status === "CANCELLED"}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{noteText.length}/2000</span>
              {appt.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  onClick={saveNote}
                  disabled={savingNote || !noteText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingNote ? "Guardando..." : appt.medicalNote ? "Actualizar nota" : "Guardar nota"}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DoctorAgendaClient({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
        <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No tenés turnos programados para hoy en adelante.</p>
        <p className="text-slate-400 text-sm mt-1">Los turnos futuros aparecerán aquí automáticamente.</p>
      </div>
    );
  }

  const today = appointments.filter(a => {
    const d = new Date(a.startTime);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });
  const upcoming = appointments.filter(a => {
    const d = new Date(a.startTime);
    const t = new Date();
    return d.toDateString() !== t.toDateString();
  });

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Hoy — {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </h2>
          <div className="space-y-3">
            {today.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Próximos turnos</h2>
          <div className="space-y-3">
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}
