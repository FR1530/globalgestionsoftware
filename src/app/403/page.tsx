export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-red-500 mb-4 opacity-80">403</div>
        <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          No tenés permiso para acceder a esta sección del sistema.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          ← Volver al Dashboard
        </a>
      </div>
    </div>
  );
}
