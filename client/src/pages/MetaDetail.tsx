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
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Plus, Trash2, Zap, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const trackableSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["binary", "numeric"]),
  targetValue: z.number().min(0, "El valor objetivo debe ser positivo"),
});

type TrackableFormData = z.infer<typeof trackableSchema>;

export default function MetaDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCreateTrackable, setShowCreateTrackable] = useState(false);
  const [showAIPointDialog, setShowAIPointDialog] = useState(false);
  const [aiPointValue, setAIPointValue] = useState(5);
  const [dailyNote, setDailyNote] = useState("");

  const metaId = parseInt(id || "0", 10);

  // Queries
  const { data: trackeables, isLoading: trackablesLoading, refetch: refetchTrackeables } = 
    trpc.hierarchy.trackeables.list.useQuery(metaId, {
      enabled: isAuthenticated && metaId > 0,
    });

  const { data: trackableValues } = 
    trpc.tracking.trackableValues.getByDate.useQuery({ trackableId: metaId, date: selectedDate }, {
      enabled: isAuthenticated && metaId > 0,
    });

  const { data: noteData } = 
    trpc.tracking.notes.getByMetaAndDate.useQuery({ metaId, date: selectedDate }, {
      enabled: isAuthenticated && metaId > 0,
    });

  // Mutations
  const createTrackableMutation = trpc.hierarchy.trackeables.create.useMutation({
    onSuccess: () => {
      refetchTrackeables();
      setShowCreateTrackable(false);
      form.reset();
    },
  });

  const deleteTrackableMutation = trpc.hierarchy.trackeables.delete.useMutation({
    onSuccess: () => {
      refetchTrackeables();
    },
  });

  const saveTrackableValueMutation = trpc.tracking.trackableValues.create.useMutation();
  const saveDailyNoteMutation = trpc.tracking.notes.create.useMutation();
  const generateAIPointMutation = trpc.tracking.aiPoints.generateDaily.useMutation({
    onSuccess: () => {
      setShowAIPointDialog(false);
      setAIPointValue(5);
    },
  });

  const form = useForm<TrackableFormData>({
    resolver: zodResolver(trackableSchema),
    defaultValues: {
      type: "numeric",
      targetValue: 1,
    },
  });

  const onSubmitTrackable = (data: TrackableFormData) => {
    createTrackableMutation.mutate({
      metaId,
      name: data.name,
      type: data.type,
      targetValue: data.targetValue,
    });
  };

  const handleSaveTrackableValue = (trackableId: number, value: number) => {
    saveTrackableValueMutation.mutate({
      trackableId,
      date: selectedDate,
      value,
      durationMinutes: 0,
    });
  };

  const handleSaveNote = () => {
    saveDailyNoteMutation.mutate({
      metaId,
      date: selectedDate,
      content: dailyNote,
    });
  };

  const handleGenerateAIPoint = () => {
    generateAIPointMutation.mutate({
      metaId,
      date: selectedDate,
      metaName: "Meta",
      trackablesData: trackeables?.map((t: any) => {
        const val = trackableValues?.find((v: any) => v.trackableId === t.id)?.value || 0;
        const numVal = typeof val === 'string' ? parseFloat(val as string) : (val as number);
        return {
          name: t.name,
          type: t.type,
          targetValue: t.targetValue,
          actualValue: numVal,
          progress: (numVal / t.targetValue) * 100,
        };
      }) || [],
      noteContent: dailyNote,
    });
  };

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  if (trackablesLoading) {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Meta Semanal</h1>
          <p className="text-lg text-slate-600">Trackea tu progreso diario y evalúa tu desempeño</p>
        </div>

        {/* Date Selector */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Selecciona un Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {/* Trackeables Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Trackeables</h2>
            <Dialog open={showCreateTrackable} onOpenChange={setShowCreateTrackable}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Trackeable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Trackeable</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmitTrackable)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Kilómetros corridos"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <select
                      id="type"
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("type")}
                    >
                      <option value="binary">Binario (Sí/No)</option>
                      <option value="numeric">Numérico (Cantidad)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="targetValue">Valor Objetivo</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder="Ej: 20"
                      {...form.register("targetValue", { valueAsNumber: true })}
                    />
                    {form.formState.errors.targetValue && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.targetValue.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateTrackable(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createTrackableMutation.isPending}>
                      {createTrackableMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {trackeables && trackeables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trackeables.map((trackable: any) => {
                const value = trackableValues?.find((v: any) => v.trackableId === trackable.id);
                return (
                  <Card key={trackable.id} className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{trackable.name}</CardTitle>
                          <CardDescription>
                            Objetivo: {trackable.targetValue}
                            {trackable.type === "binary" ? " (Sí/No)" : ""}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteTrackableMutation.mutate(trackable.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {trackable.type === "binary" ? (
                        <div className="flex gap-2">
                          <Button
                            variant={Number(value?.value) === 1 ? "default" : "outline"}
                            onClick={() => handleSaveTrackableValue(trackable.id, 1)}
                          >
                            Sí
                          </Button>
                          <Button
                            variant={Number(value?.value) === 0 ? "default" : "outline"}
                            onClick={() => handleSaveTrackableValue(trackable.id, 0)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="Ingresa el valor"
                            defaultValue={value?.value || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleSaveTrackableValue(trackable.id, val);
                            }}
                          />
                          {value && (
                            <p className="text-sm text-slate-600">
                              Progreso: {((Number(value.value) / trackable.targetValue) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600 mb-4">No hay trackeables en esta meta</p>
                <Button onClick={() => setShowCreateTrackable(true)}>Crear Primer Trackeable</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Nota del Día</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Escribe tus reflexiones sobre el día..."
                value={dailyNote}
                onChange={(e) => setDailyNote(e.target.value)}
                className="min-h-32"
              />
              <Button
                onClick={() => saveDailyNoteMutation.mutate({ metaId, date: selectedDate, content: dailyNote })}
                className="mt-4"
                disabled={saveDailyNoteMutation.isPending}
              >
                {saveDailyNoteMutation.isPending ? "Guardando..." : "Guardar Nota"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AIPoint Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-600" />
            Evaluación AIPoint
          </h2>
          <Dialog open={showAIPointDialog} onOpenChange={setShowAIPointDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-lg px-8 py-6">
                <Zap className="w-5 h-5" />
                Evaluar Hoy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Evalúa tu Desempeño Hoy</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <p className="text-slate-600">
                  Basándote en tus trackeables, notas y desempeño general, ¿cómo calificarías tu día?
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Puntuación: {aiPointValue}/10</Label>
                  </div>
                  <Slider
                    value={[aiPointValue]}
                    onValueChange={(value) => setAIPointValue(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <Button
                        key={num}
                        variant={aiPointValue === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAIPointValue(num)}
                        className="w-8 h-8 p-0"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIPointDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerateAIPoint}
                    disabled={generateAIPointMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {generateAIPointMutation.isPending ? "Evaluando..." : "Guardar Evaluación"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
