import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const objetivoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  description: z.string().optional(),
});

type ObjetivoFormData = z.infer<typeof objetivoSchema>;

export default function MisionDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateObjetivo, setShowCreateObjetivo] = useState(false);

  const misionId = parseInt(id || "0", 10);

  const { data: todosMisiones } = trpc.hierarchy.misiones.list.useQuery(0, {
    enabled: false,
  });

  const { data: objetivos, isLoading: objetivosLoading, refetch: refetchObjetivos } = 
    trpc.hierarchy.objetivos.list.useQuery(misionId, {
      enabled: isAuthenticated && misionId > 0,
    });

  const createObjetivoMutation = trpc.hierarchy.objetivos.create.useMutation({
    onSuccess: () => {
      refetchObjetivos();
      setShowCreateObjetivo(false);
      form.reset();
    },
  });

  const deleteObjetivoMutation = trpc.hierarchy.objetivos.delete.useMutation({
    onSuccess: () => {
      refetchObjetivos();
    },
  });

  const form = useForm<ObjetivoFormData>({
    resolver: zodResolver(objetivoSchema),
  });

  const onSubmit = (data: ObjetivoFormData) => {
    createObjetivoMutation.mutate({
      misionId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || undefined,
    });
  };

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  if (objetivosLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => setLocation("/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Misión</h1>
          <p className="text-lg text-slate-600">Gestiona los objetivos de esta misión</p>
        </div>

        {/* Objetivos Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Objetivos (Mensuales)</h2>
            <Dialog open={showCreateObjetivo} onOpenChange={setShowCreateObjetivo}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Correr 100km este mes"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...form.register("startDate")}
                      />
                      {form.formState.errors.startDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.startDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endDate">Fecha Fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...form.register("endDate")}
                      />
                      {form.formState.errors.endDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe este objetivo..."
                      {...form.register("description")}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateObjetivo(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createObjetivoMutation.isPending}>
                      {createObjetivoMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {objetivos && objetivos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {objetivos.map((objetivo: any) => (
                <Card
                  key={objetivo.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setLocation(`/objetivo/${objetivo.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {objetivo.name}
                        </CardTitle>
                        {objetivo.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {objetivo.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Creado {new Date(objetivo.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteObjetivoMutation.mutate(objetivo.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600 mb-4">No hay objetivos en esta misión</p>
                <Button onClick={() => setShowCreateObjetivo(true)}>Crear Primer Objetivo</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
