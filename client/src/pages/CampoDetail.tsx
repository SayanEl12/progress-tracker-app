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

const misionSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type MisionFormData = z.infer<typeof misionSchema>;

export default function CampoDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateMision, setShowCreateMision] = useState(false);

  const campoId = parseInt(id || "0", 10);

  const { data: todosCampos, isLoading: campoLoading } = trpc.hierarchy.campos.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const campo = todosCampos?.find(c => c.id === campoId);

  const { data: misiones, isLoading: misionesLoading, refetch: refetchMisiones } = 
    trpc.hierarchy.misiones.list.useQuery(campoId, {
      enabled: isAuthenticated && campoId > 0,
    });

  const createMisionMutation = trpc.hierarchy.misiones.create.useMutation({
    onSuccess: () => {
      refetchMisiones();
      setShowCreateMision(false);
      form.reset();
    },
  });

  const deleteMisionMutation = trpc.hierarchy.misiones.delete.useMutation({
    onSuccess: () => {
      refetchMisiones();
    },
  });

  const form = useForm<MisionFormData>({
    resolver: zodResolver(misionSchema),
  });

  const onSubmit = (data: MisionFormData) => {
    createMisionMutation.mutate({
      campoId,
      name: data.name,
      description: data.description || undefined,
    });
  };

  if (!isAuthenticated) {
    return <div>Por favor inicia sesión</div>;
  }

  if (campoLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!campo || !todosCampos) {
    return (
      <div className="p-8 text-center">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => setLocation("/dashboard")}>
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Button>
        <p>Campo no encontrado</p>
      </div>
    );
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{campo.name}</h1>
          {campo.description && (
            <p className="text-lg text-slate-600">{campo.description}</p>
          )}
        </div>

        {/* Misiones Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Misiones</h2>
            <Dialog open={showCreateMision} onOpenChange={setShowCreateMision}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Misión
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Misión</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Mejorar salud"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe esta misión..."
                      {...form.register("description")}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateMision(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMisionMutation.isPending}>
                      {createMisionMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {misionesLoading ? (
            <div className="text-center py-12 text-slate-500">Cargando misiones...</div>
          ) : misiones && misiones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {misiones.map((mision: any) => (
                <Card
                  key={mision.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setLocation(`/mision/${mision.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {mision.name}
                        </CardTitle>
                        {mision.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {mision.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Creada {new Date(mision.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMisionMutation.mutate(mision.id);
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
                <p className="text-slate-600 mb-4">No hay misiones en este campo</p>
                <Button onClick={() => setShowCreateMision(true)}>Crear Primera Misión</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
