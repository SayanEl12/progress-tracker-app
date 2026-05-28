import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, ChevronRight, Target, Zap, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import CampoList from "@/components/hierarchy/CampoList";
import CreateCampoDialog from "@/components/hierarchy/CreateCampoDialog";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateCampo, setShowCreateCampo] = useState(false);
  
  const { data: campos, isLoading, refetch } = trpc.hierarchy.campos.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white">Progress Tracker</h1>
            <p className="text-xl text-slate-300">Sistema elegante de gestión de progreso personal</p>
          </div>
          <p className="text-slate-400 max-w-md mx-auto">
            Organiza tus objetivos en una jerarquía clara: Campos → Misiones → Objetivos → Metas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Bienvenido, {user?.name}</h1>
              <p className="text-lg text-slate-600">Gestiona tu progreso personal con elegancia y precisión</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setLocation("/daily")}
              >
                <Calendar className="w-4 h-4" />
                Hoy
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setLocation("/progress")}
              >
                <BarChart3 className="w-4 h-4" />
                Progreso
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Campos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{campos?.length || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Áreas de enfoque principal</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Metas Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">—</div>
              <p className="text-xs text-slate-500 mt-1">Próximamente disponible</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Progreso General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">—</div>
              <p className="text-xs text-slate-500 mt-1">Próximamente disponible</p>
            </CardContent>
          </Card>
        </div>

        {/* Campos Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Mis Campos</h2>
              <p className="text-slate-600 text-sm mt-1">Organiza tus áreas de enfoque principal</p>
            </div>
            <Button
              onClick={() => setShowCreateCampo(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo Campo
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Cargando campos...</div>
          ) : campos && campos.length > 0 ? (
            <CampoList campos={campos} onRefresh={() => refetch()} />
          ) : (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <Target className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-600">No tienes campos creados aún</p>
                  <Button
                    onClick={() => setShowCreateCampo(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear tu primer Campo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Campo Dialog */}
      <CreateCampoDialog
        open={showCreateCampo}
        onOpenChange={setShowCreateCampo}
        onSuccess={() => {
          setShowCreateCampo(false);
          refetch();
        }}
      />
    </div>
  );
}
