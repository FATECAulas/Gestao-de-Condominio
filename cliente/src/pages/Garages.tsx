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
import { Plus, Shuffle } from "lucide-react";
import { toast } from "sonner";

export default function Garages() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ garageNumber: '', type: 'sortable' });

  const { data: garages, refetch } = trpc.garages.list.useQuery();
  const { data: drawHistory } = trpc.garageDraws.history.useQuery({ limit: 10 });
  
  const createMutation = trpc.garages.create.useMutation({
    onSuccess: () => {
      toast.success('Garagem criada com sucesso');
      setFormData({ garageNumber: '', type: 'sortable' });
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleCreate = () => {
    if (!formData.garageNumber) {
      toast.error('Preencha o número da garagem');
      return;
    }
    createMutation.mutate(formData as any);
  };

  const handleDraw = () => {
    toast.info('Funcionalidade de sorteio será implementada');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      fixed: { label: 'Fixa', color: 'bg-red-100 text-red-700' },
      predetermined: { label: 'Pré-determinada', color: 'bg-blue-100 text-blue-700' },
      sortable: { label: 'Sorteável', color: 'bg-green-100 text-green-700' },
    };
    return labels[type] || { label: 'Desconhecido', color: 'bg-gray-100 text-gray-700' };
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
            <h1 className="text-3xl font-bold text-foreground">Garagens</h1>
            <p className="text-muted-foreground mt-2">Gerencie as garagens e sorteios</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDraw} variant="outline" className="gap-2">
              <Shuffle size={20} />
              Realizar Sorteio
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={20} />
                  Nova Garagem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Garagem</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova garagem ao condomínio
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="garageNumber">Número da Garagem</Label>
                    <Input
                      id="garageNumber"
                      value={formData.garageNumber}
                      onChange={(e) => setFormData({ ...formData, garageNumber: e.target.value })}
                      placeholder="G1, G2, etc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixa (Síndico/Subsíndico)</SelectItem>
                        <SelectItem value="predetermined">Pré-determinada (1 veículo)</SelectItem>
                        <SelectItem value="sortable">Sorteável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Criar Garagem
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Garages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Garagens</CardTitle>
            <CardDescription>
              Total de {garages?.length || 0} garagens registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Garagem</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {garages?.map((garage) => {
                    const typeInfo = getTypeLabel(garage.type);
                    return (
                      <tr key={garage.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{garage.garageNumber}</td>
                        <td className="py-3 px-4">
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {garage.assignedUserId ? 'Ocupada' : 'Disponível'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Draw History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Sorteios</CardTitle>
            <CardDescription>
              Últimos sorteios realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drawHistory && drawHistory.length > 0 ? (
              <div className="space-y-2">
                {drawHistory.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Sorteio #{draw.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(draw.drawDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={draw.result === 'won' ? 'default' : 'secondary'}>
                      {draw.result === 'won' ? 'Ganhou' : draw.result === 'lost' ? 'Perdeu' : 'Pulou'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum sorteio realizado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
