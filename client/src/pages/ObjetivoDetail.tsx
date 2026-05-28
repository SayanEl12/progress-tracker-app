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

const metaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  description: z.string().optional(),
});

type MetaFormData = z.infer<typeof metaSchema>;

export default function ObjetivoDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateMeta, setShowCreateMeta] = useState(false);

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

  const deleteMetaMutation = trpc.hierarchy.metas.delete.useMutation({
    onSuccess: () => {
      refetchMetas();
    },
  });

  const form = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
  });

  const onSubmit = (data: MetaFormData) => {
    createMetaMutation.mutate({
      objetivoId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || undefined,
      weightAI: 0.5,
      weightTrackables: 0.5,
    });
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
            <Dialog open={showCreateMeta} onOpenChange={setShowCreateMeta}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Meta</DialogTitle>
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
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateMeta(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMetaMutation.isPending}>
                      {createMetaMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {metas && metas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metas.map((meta: any) => (
                <Card
                  key={meta.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setLocation(`/meta/${meta.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {meta.name}
                        </CardTitle>
                        {meta.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {meta.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Creada {new Date(meta.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMetaMutation.mutate(meta.id);
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
