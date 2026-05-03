import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Utensils() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: 1, condition: 'good' });

  const { data: utensils, refetch } = trpc.kitchenUtensils.list.useQuery();
  
  const createMutation = trpc.kitchenUtensils.create.useMutation({
    onSuccess: () => {
      toast.success('Utensílio adicionado com sucesso');
      setFormData({ name: '', quantity: 1, condition: 'good' });
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.kitchenUtensils.delete.useMutation({
    onSuccess: () => {
      toast.success('Utensílio removido com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Preencha o nome do utensílio');
      return;
    }
    createMutation.mutate(formData as any);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover este utensílio?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleGenerateReport = () => {
    toast.info('Relatório será gerado em PDF');
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      excellent: { label: 'Excelente', color: 'bg-green-100 text-green-700' },
      good: { label: 'Bom', color: 'bg-blue-100 text-blue-700' },
      fair: { label: 'Regular', color: 'bg-yellow-100 text-yellow-700' },
      poor: { label: 'Ruim', color: 'bg-red-100 text-red-700' },
    };
    return labels[condition] || { label: 'Desconhecido', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Utensílios da Cozinha</h1>
            <p className="text-muted-foreground mt-2">Gerencie os utensílios do salão de festas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} variant="outline" className="gap-2">
              <Download size={20} />
              Gerar Relatório
            </Button>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={20} />
                    Novo Utensílio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Utensílio</DialogTitle>
                    <DialogDescription>
                      Adicione um novo utensílio à cozinha
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Utensílio</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Panela, Prato, Copo, etc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="condition">Estado de Conservação</Label>
                      <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excelente</SelectItem>
                          <SelectItem value="good">Bom</SelectItem>
                          <SelectItem value="fair">Regular</SelectItem>
                          <SelectItem value="poor">Ruim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreate} className="w-full">
                      Adicionar Utensílio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Utensils Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventário de Utensílios</CardTitle>
            <CardDescription>
              Total de {utensils?.length || 0} tipos de utensílios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Utensílio</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Quantidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                    {isAdmin && <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {utensils?.map((utensil) => {
                    const conditionInfo = getConditionLabel(utensil.condition);
                    return (
                      <tr key={utensil.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{utensil.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{utensil.quantity}</td>
                        <td className="py-3 px-4">
                          <Badge className={conditionInfo.color}>{conditionInfo.label}</Badge>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(utensil.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
