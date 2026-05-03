import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Residents() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'user' });

  const { data: residents, refetch } = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleUpdateRole = (userId: number, role: string) => {
    if (!isAdmin) return;
    updateRoleMutation.mutate({ userId, role: role as 'user' | 'subsindico' });
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
            <h1 className="text-3xl font-bold text-foreground">Condôminos</h1>
            <p className="text-muted-foreground mt-2">Gerencie os condôminos do condomínio</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Novo Condômino
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Novo'} Condômino</DialogTitle>
                <DialogDescription>
                  Preencha os dados do condômino
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <Button onClick={() => setOpen(false)} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Residents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Condôminos</CardTitle>
            <CardDescription>
              Total de {residents?.length || 0} condôminos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Telefone</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Perfil</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {residents?.map((resident) => (
                    <tr key={resident.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{resident.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{resident.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{resident.phone}</td>
                      <td className="py-3 px-4">
                        <Select
                          value={resident.role}
                          onValueChange={(value) => handleUpdateRole(resident.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Condômino</SelectItem>
                            <SelectItem value="subsindico">Subsíndico</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
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
