import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateCampoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCampoDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCampoDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createCampo = trpc.hierarchy.campos.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre del Campo es requerido");
      return;
    }

    try {
      await createCampo.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Campo creado exitosamente");
      setName("");
      setDescription("");
      onSuccess();
    } catch (error) {
      toast.error("Error al crear el Campo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo Campo</DialogTitle>
          <DialogDescription>
            Un Campo es el nivel más alto de tu jerarquía de objetivos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Campo *</Label>
            <Input
              id="name"
              placeholder="ej: Salud, Carrera, Familia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createCampo.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el propósito y alcance de este Campo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createCampo.isPending}
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCampo.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createCampo.isPending}
              className="gap-2"
            >
              {createCampo.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear Campo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
