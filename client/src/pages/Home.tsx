import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, Target, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-8 mb-20">
            <h1 className="text-6xl font-bold text-slate-900">Progress Tracker</h1>
            <p className="text-2xl text-slate-600">Sistema elegante de gestión de progreso personal</p>
            <Button
              size="lg"
              onClick={() => setLocation("/dashboard")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Acceder al Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <Target className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">Jerarquía Clara</h3>
              <p className="text-slate-600">Campos → Misiones → Objetivos → Metas</p>
            </div>
            <div className="text-center space-y-3">
              <Zap className="w-12 h-12 text-amber-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">Seguimiento Diario</h3>
              <p className="text-slate-600">Trackeables, notas y evaluaciones AIPoint</p>
            </div>
            <div className="text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">Análisis Inteligente</h3>
              <p className="text-slate-600">Conclusiones semanales con IA</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-white">Progress Tracker</h1>
          <p className="text-xl text-slate-300">Sistema elegante de gestión de progreso personal</p>
        </div>
        <p className="text-slate-400 max-w-md mx-auto text-lg">
          Organiza tus objetivos en una jerarquía clara y monitorea tu progreso con evaluaciones inteligentes
        </p>
        <Button
          size="lg"
          onClick={() => (window.location.href = getLoginUrl())}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
        >
          Iniciar Sesión
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
