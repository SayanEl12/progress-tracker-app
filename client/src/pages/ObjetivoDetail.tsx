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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Plus, Trash2, Edit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const metaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  description: z.string().optional(),
  weightAI: z.number().min(0).max(1),
  weightTrackables: z.number().min(0).max(1),
});

type MetaFormData = z.infer<typeof metaSchema>;

export default function ObjetivoDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateMeta, setShowCreateMeta] = useState(false);
  const [editingMetaId, setEditingMetaId] = useState<number | null>(null);
  const [editingMeta, setEditingMeta] = useState<any>(null);

  const objetivoId = parseInt(id || "0", 10);

  const { data: metas, isLoading: metasLoading, refetch: refetchMetas } = 
    trpc.hierarchy.metas.list.useQuery(objetivoId, {
      enabled: isAuthenticated && objetivoId > 0,
    });

  const createMetaMutation = trpc.hierarchy.metas.create.useMutation({
    onSuccess: () => {
      refetchMetas();
      setShowCreateMeta(false);
      form.reset();
    },
  });

  const updateMetaMutation = trpc.hierarchy.metas.update.useMutation({
    onSuccess: () => {
      refetchMetas();
      setEditingMetaId(null);
      setEditingMeta(null);
      form.reset();
    },
  });

  const deleteMetaMutation = trpc.hierarchy.metas.delete.useMutation({
    onSuccess: () => {
      refetchMetas();
    },
  });

  const form = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      weightAI: 0.4,
      weightTrackables: 0.6,
    },
  });

  const onSubmit = (data: MetaFormData) => {
    if (editingMetaId) {
      updateMetaMutation.mutate({
        id: editingMetaId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description || undefined,
        weightAI: data.weightAI,
        weightTrackables: data.weightTrackables,
      });
    } else {
      createMetaMutation.mutate({
        objetivoId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description || undefined,
        weightAI: data.weightAI,
        weightTrackables: data.weightTrackables,
      });
    }
  };

  const getMetaStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    if (today < start) return { label: "Próxima", color: "bg-yellow-100 text-yellow-800" };
    if (today > end) return { label: "Completada", color: "bg-gray-100 text-gray-800" };
    return { label: "Activa", color: "bg-green-100 text-green-800" };
  };

  const handleEditMeta = (meta: any) => {
    setEditingMetaId(meta.id);
    setEditingMeta(meta);
    form.reset({
      name: meta.name,
      startDate: meta.startDate,
      endDate: meta.endDate,
      description: meta.description || "",
      weightAI: parseFloat(meta.weightAI || "0.4"),
      weightTrackables: parseFloat(meta.weightTrackables || "0.6"),
    });
    setShowCreateMeta(true);
  };

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  if (metasLoading) {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Objetivo</h1>
          <p className="text-lg text-slate-600">Gestiona las metas semanales de este objetivo</p>
        </div>

        {/* Metas Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Metas (Semanales)</h2>
            <Dialog open={showCreateMeta} onOpenChange={(open) => {
              setShowCreateMeta(open);
              if (!open) {
                setEditingMetaId(null);
                setEditingMeta(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingMetaId ? "Editar Meta" : "Crear Nueva Meta"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Correr 20km esta semana"
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
                      placeholder="Describe esta meta..."
                      {...form.register("description")}
                    />
                  </div>

                  {/* Weight Sliders */}
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Peso AIPoints (a)</Label>
                        <span className="text-sm font-semibold text-slate-900">
                          {(form.watch("weightAI") || 0.4).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[form.watch("weightAI") || 0.4]}
                        onValueChange={(val) => form.setValue("weightAI", val[0])}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Importancia de la evaluación diaria (1-10)
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Peso Trackeables (b)</Label>
                        <span className="text-sm font-semibold text-slate-900">
                          {(form.watch("weightTrackables") || 0.6).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={[form.watch("weightTrackables") || 0.6]}
                        onValueChange={(val) => form.setValue("weightTrackables", val[0])}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Importancia del progreso en acciones (0-100%)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateMeta(false);
                        setEditingMetaId(null);
                        setEditingMeta(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMetaMutation.isPending || updateMetaMutation.isPending}
                    >
                      {editingMetaId ? (
                        updateMetaMutation.isPending ? "Actualizando..." : "Actualizar"
                      ) : (
                        createMetaMutation.isPending ? "Creando..." : "Crear"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {metas && metas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metas.map((meta: any) => {
                const status = getMetaStatus(meta.startDate, meta.endDate);
                const weightAI = parseFloat(meta.weightAI || "0.4");
                const weightTrackables = parseFloat(meta.weightTrackables || "0.6");
                // Placeholder progress - será calculado desde el backend
                const progress = 50;
                
                return (
                  <Card
                    key={meta.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle 
                              className="text-lg text-slate-900 cursor-pointer group-hover:text-blue-600 transition-colors truncate"
                              onClick={() => setLocation(`/meta/${meta.id}`)}
                            >
                              {meta.name}
                            </CardTitle>
                            <Badge className={`text-xs whitespace-nowrap ${status.color}`}>
                              {status.label}
                            </Badge>
                          </div>
                          {meta.description && (
                            <CardDescription className="mt-1 line-clamp-2 text-xs">
                              {meta.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMeta(meta)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMetaMutation.mutate(meta.id);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-slate-600">Progreso</span>
                          <span className="text-xs font-semibold text-slate-900">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Weights Display */}
                      <div className="bg-slate-50 rounded p-2">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">Fórmula:</span> {weightAI.toFixed(2)}×AIPoints + {weightTrackables.toFixed(2)}×Trackeables
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>📅 {new Date(meta.startDate).toLocaleDateString()} - {new Date(meta.endDate).toLocaleDateString()}</p>
                        <p className="text-slate-400">Creada {new Date(meta.createdAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600 mb-4">No hay metas en este objetivo</p>
                <Button onClick={() => setShowCreateMeta(true)}>Crear Primera Meta</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
