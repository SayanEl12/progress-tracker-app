// client/src/pages/DailyCalendar.tsx
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar, Zap, Save, Loader2 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";

export default function DailyCalendar() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null);
  const [trackableValues, setTrackableValues] = useState<Record<number, number | undefined>>({});
  const [noteContent, setNoteContent] = useState("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dateDisplay = format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });

  // Get active metas for the selected date
  const { data: metas } = trpc.hierarchy.metas.list.useQuery(1, {
    enabled: isAuthenticated,
  });

  // Get trackeables for selected meta
  const { data: trackeables } = trpc.hierarchy.trackeables.list.useQuery(selectedMetaId || 0, {
    enabled: isAuthenticated && selectedMetaId !== null,
  });

  // Get note for selected meta and date
  const { data: notes } = trpc.tracking.notes.getByMetaAndDate.useQuery(
    { metaId: selectedMetaId || 0, date: dateStr },
    { enabled: isAuthenticated && selectedMetaId !== null }
  );

  // Get AIPoint for selected meta and date
  const { data: aiPoints } = trpc.tracking.aiPoints.getByMetaAndDate.useQuery(
    { metaId: selectedMetaId || 0, date: dateStr },
    { enabled: isAuthenticated && selectedMetaId !== null }
  );

  const createNote = trpc.tracking.notes.create.useMutation();
  const updateNote = trpc.tracking.notes.update.useMutation();
  const createTrackableValue = trpc.tracking.trackableValues.create.useMutation();
  const generateAIPoint = trpc.tracking.aiPoints.generateDaily.useMutation();

  const selectedMeta = metas?.find(m => m.id === selectedMetaId);
  const currentNote = notes?.[0];

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleSaveNote = async () => {
    if (!selectedMetaId) return;
    if (!noteContent.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }

    try {
      if (currentNote) {
        await updateNote.mutateAsync({
          id: currentNote.id,
          content: noteContent,
        });
        toast.success("Nota actualizada");
      } else {
        await createNote.mutateAsync({
          metaId: selectedMetaId,
          date: dateStr,
          content: noteContent,
        });
        toast.success("Nota creada");
      }
    } catch (error) {
      toast.error("Error al guardar la nota");
    }
  };

  const handleSaveTrackable = async (trackableId: number) => {
    const value = trackableValues[trackableId];
    if (value === undefined) {
      toast.error("Ingresa un valor");
      return;
    }

    try {
      await createTrackableValue.mutateAsync({
        trackableId,
        date: dateStr,
        value,
      });
      toast.success("Trackeable registrado");
      setTrackableValues(prev => ({ ...prev, [trackableId]: undefined }));
    } catch (error) {
      toast.error("Error al registrar trackeable");
    }
  };

  const handleGenerateAIPoint = async () => {
    if (!selectedMetaId || !selectedMeta || !trackeables) return;

    try {
      const trackablesData = trackeables.map(t => ({
        name: t.name,
        type: t.type as "binary" | "numeric",
        targetValue: parseFloat(t.targetValue.toString()),
        actualValue: trackableValues[t.id] || 0,
        progress: (trackableValues[t.id] || 0) / parseFloat(t.targetValue.toString()),
      }));

      const result = await generateAIPoint.mutateAsync({
        metaId: selectedMetaId,
        date: dateStr,
        metaName: selectedMeta.name,
        metaDescription: selectedMeta.description || undefined,
        trackablesData,
        noteContent: noteContent || undefined,
      });

      toast.success(`AIPoint: ${result.score}/10`);
    } catch (error) {
      toast.error("Error al generar AIPoint");
    }
  };

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Date Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Seguimiento Diario</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Hoy
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDay}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 capitalize">
                    {dateDisplay}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">{dateStr}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDay}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metas List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Metas Activas</h3>
            {metas && metas.length > 0 ? (
              metas.map(meta => (
                <Card
                  key={meta.id}
                  className={`border-0 shadow-sm cursor-pointer transition-all ${selectedMetaId === meta.id
                      ? "ring-2 ring-blue-600 bg-blue-50"
                      : "hover:shadow-md"
                    }`}
                  onClick={() => {
                    setSelectedMetaId(meta.id);
                    setTrackableValues({});
                    setNoteContent(currentNote?.content || "");
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{meta.name}</CardTitle>
                    {meta.description && (
                      <CardDescription className="line-clamp-2">
                        {meta.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-6 text-center text-slate-500">
                  No hay metas activas
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trackeables and Notes */}
          {selectedMetaId && selectedMeta && (
            <div className="lg:col-span-2 space-y-6">
              {/* Trackeables */}
              {trackeables && trackeables.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Trackeables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trackeables.map(trackeable => (
                      <div key={trackeable.id} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {trackeable.name}
                          {trackeable.type === "numeric" && (
                            <span className="text-xs text-slate-500 ml-2">
                              (Meta: {trackeable.targetValue})
                            </span>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type={trackeable.type === "binary" ? "checkbox" : "number"}
                            placeholder={trackeable.type === "binary" ? "" : "Valor"}
                            value={trackableValues[trackeable.id] ?? ""}
                            onChange={(e) => {
                              const value = trackeable.type === "binary"
                                ? e.target.checked ? 1 : 0
                                : parseFloat(e.target.value) || 0;
                              setTrackableValues(prev => ({
                                ...prev,
                                [trackeable.id]: value,
                              }));
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveTrackable(trackeable.id)}
                            disabled={trackableValues[trackeable.id] === undefined}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Nota del Día</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Escribe tus reflexiones, desafíos o logros del día..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSaveNote}
                    disabled={createNote.isPending || updateNote.isPending}
                    className="w-full"
                  >
                    {(createNote.isPending || updateNote.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Guardar Nota
                  </Button>
                </CardContent>
              </Card>

              {/* AIPoint */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Evaluación AIPoint
                  </CardTitle>
                  <CardDescription>
                    Genera una evaluación inteligente de tu progreso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiPoints && aiPoints.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Puntuación:</span>
                        <span className="text-2xl font-bold text-amber-600">
                          {aiPoints[0].score}/10
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Análisis:</p>
                        <p className="text-sm text-slate-600">{aiPoints[0].rationale}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Recomendación:</p>
                        <p className="text-sm text-slate-600">{aiPoints[0].recommendations}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 mb-4">
                      Aún no has generado una evaluación para este día
                    </p>
                  )}
                  <Button
                    onClick={handleGenerateAIPoint}
                    disabled={generateAIPoint.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {generateAIPoint.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Generar AIPoint
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
