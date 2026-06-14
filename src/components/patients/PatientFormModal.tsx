"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPatient, updatePatient } from "@/features/patients/mutations";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  birthDate?: string | null;
  email: string; // correo del user asociado
};

type Props = {
  editingPatient?: Patient | null;
  onClose: () => void;
};

export function PatientFormModal({ editingPatient, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!editingPatient;

  const [firstName, setFirstName] = useState(editingPatient?.firstName ?? "");
  const [lastName, setLastName] = useState(editingPatient?.lastName ?? "");
  const [phone, setPhone] = useState(editingPatient?.phone ?? "");
  const [birthDate, setBirthDate] = useState(
    editingPatient?.birthDate
      ? new Date(editingPatient.birthDate).toISOString().split("T")[0]
      : ""
  );
  const [email, setEmail] = useState(editingPatient?.email ?? "");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEditing) {
        await updatePatient(editingPatient.id, {
          email,
          firstName,
          lastName,
          phone: phone || undefined,
          birthDate: birthDate || undefined,
        });
      } else {
        if (!password) {
          setError("La contraseña es obligatoria.");
          setLoading(false);
          return;
        }
        await createPatient({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          birthDate: birthDate || undefined,
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

  const inputClass =
    "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditing
              ? `Editar: ${editingPatient.firstName} ${editingPatient.lastName}`
              : "Nuevo Paciente"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cuenta de acceso */}
          <div className={`border rounded-xl p-4 space-y-3 ${isEditing ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"}`}>
            <p className={`text-sm font-semibold ${isEditing ? "text-slate-700 dark:text-slate-300" : "text-emerald-700 dark:text-emerald-300"}`}>
              Cuenta de acceso al sistema
            </p>
            <div className={`grid gap-3 ${isEditing ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className={inputClass}
                />
              </div>
              {!isEditing && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Contraseña inicial
                  </label>
                  <input
                    type="password"
                    value={password}
                    required={!isEditing}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nombre
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="María"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Apellido
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="González"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Teléfono <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5491112345678"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Fecha de nacimiento <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
            </div>
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
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Paciente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
