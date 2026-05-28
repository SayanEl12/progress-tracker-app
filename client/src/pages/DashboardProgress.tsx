import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ChevronRight, TrendingUp, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardProgress() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: campos, isLoading } = trpc.hierarchy.campos.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard de Progreso</h1>
          <p className="text-lg text-slate-600">Visualiza tu avance en todos los niveles jerárquicos</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Campos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{campos?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Progreso Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">—</div>
              <p className="text-xs text-slate-500 mt-1">Próximamente</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Metas Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">—</div>
              <p className="text-xs text-slate-500 mt-1">Próximamente</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">AIPoints Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">—</div>
              <p className="text-xs text-slate-500 mt-1">Próximamente</p>
            </CardContent>
          </Card>
        </div>

        {/* Campos Progress */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Cargando datos...</div>
        ) : campos && campos.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Mis Campos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campos.map((campo) => (
                <Card key={campo.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{campo.name}</CardTitle>
                        {campo.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {campo.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/campo/${campo.id}`)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Progreso General</span>
                        <span className="text-sm font-bold text-slate-900">—%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Misiones</p>
                        <p className="text-lg font-bold text-slate-900">—</p>
                      </div>
                      <div className="text-center">
                        <Zap className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Objetivos</p>
                        <p className="text-lg font-bold text-slate-900">—</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Metas</p>
                        <p className="text-lg font-bold text-slate-900">—</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 mb-4">No tienes campos creados aún</p>
              <Button onClick={() => setLocation("/dashboard")}>Ir al Dashboard</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
