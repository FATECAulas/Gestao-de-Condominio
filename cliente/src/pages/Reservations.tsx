import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Reservations() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    reservationDate: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const { data: reservations, refetch } = trpc.ballroomReservations.list.useQuery();
  
  const createMutation = trpc.ballroomReservations.create.useMutation({
    onSuccess: () => {
      toast.success('Reserva criada com sucesso');
      setFormData({ reservationDate: '', startTime: '', endTime: '', description: '' });
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.ballroomReservations.delete.useMutation({
    onSuccess: () => {
      toast.success('Reserva cancelada com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleCreate = () => {
    if (!formData.reservationDate || !formData.startTime || !formData.endTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate({
      ...formData,
      reservationDate: new Date(formData.reservationDate),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleGenerateDocument = () => {
    toast.info('Documento de reserva será gerado em PDF');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reservas do Salão</h1>
            <p className="text-muted-foreground mt-2">Gerencie as reservas do salão de festas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateDocument} variant="outline" className="gap-2">
              <Download size={20} />
              Gerar Documento
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={20} />
                  Nova Reserva
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Reserva</DialogTitle>
                  <DialogDescription>
                    Crie uma nova reserva do salão de festas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reservationDate">Data</Label>
                    <Input
                      id="reservationDate"
                      type="date"
                      value={formData.reservationDate}
                      onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Horário de Início</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Horário de Término</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição/Motivo</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Aniversário, Casamento, etc"
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Criar Reserva
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas Agendadas</CardTitle>
            <CardDescription>
              Total de {reservations?.length || 0} reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Horário</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Responsável</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations?.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {new Date(reservation.reservationDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {reservation.startTime} - {reservation.endTime}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{reservation.description || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">Condômino</td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button onClick={handleGenerateDocument} variant="ghost" size="sm">
                          <Download size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(reservation.id)}
                        >
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
