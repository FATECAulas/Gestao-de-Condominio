import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Units() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ unitNumber: '', block: '', floor: 0 });

  const { data: units, refetch } = trpc.units.list.useQuery();
  const createMutation = trpc.units.create.useMutation({
    onSuccess: () => {
      toast.success('Unidade criada com sucesso');
      setFormData({ unitNumber: '', block: '', floor: 0 });
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleCreate = () => {
    if (!formData.unitNumber || !formData.block) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
            <p className="text-muted-foreground mt-2">Gerencie as unidades do condomínio</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Unidade</DialogTitle>
                <DialogDescription>
                  Adicione uma nova unidade ao condomínio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unitNumber">Número da Unidade</Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="101, 201A, etc"
                  />
                </div>
                <div>
                  <Label htmlFor="block">Bloco</Label>
                  <Input
                    id="block"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    placeholder="A, B, Bloco 1, etc"
                  />
                </div>
                <div>
                  <Label htmlFor="floor">Andar</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                    placeholder="1, 2, 3, etc"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Criar Unidade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Units Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Unidades</CardTitle>
            <CardDescription>
              Total de {units?.length || 0} unidades registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Unidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Bloco</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Andar</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {units?.map((unit) => (
                    <tr key={unit.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">{unit.unitNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{unit.block}</td>
                      <td className="py-3 px-4 text-muted-foreground">{unit.floor}º andar</td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
