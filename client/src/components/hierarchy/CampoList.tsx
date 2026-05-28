import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Campo } from "@shared/types";

interface CampoListProps {
  campos: Campo[];
  onRefresh: () => void;
}

export default function CampoList({ campos, onRefresh }: CampoListProps) {
  const [, setLocation] = useLocation();
  const deleteCampo = trpc.hierarchy.campos.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este Campo?")) return;
    
    try {
      await deleteCampo.mutateAsync(id);
      toast.success("Campo eliminado");
      onRefresh();
    } catch (error) {
      toast.error("Error al eliminar el Campo");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campos.map((campo) => (
        <Card
          key={campo.id}
          className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setLocation(`/campo/${campo.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  {campo.name}
                </CardTitle>
                {campo.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {campo.description}
                  </CardDescription>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Creado {new Date(campo.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(campo.id);
                }}
                disabled={deleteCampo.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
