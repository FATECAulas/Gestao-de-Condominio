import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Building2, ParkingCircle, UtensilsCrossed } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'sindico' || user?.role === 'subsindico';

  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: isAdmin });
  const { data: units } = trpc.units.list.useQuery();
  const { data: garages } = trpc.garages.list.useQuery();
  const { data: utensils } = trpc.kitchenUtensils.list.useQuery();

  const stats = [
    ...(isAdmin ? [
      {
        icon: Users,
        label: 'Condôminos',
        value: users?.length || 0,
        color: 'bg-blue-100 text-blue-600',
      },
    ] : []),
    {
      icon: Building2,
      label: 'Unidades',
      value: units?.length || 0,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: ParkingCircle,
      label: 'Garagens',
      value: garages?.length || 0,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: UtensilsCrossed,
      label: 'Utensílios',
      value: utensils?.length || 0,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Bem-vindo ao Sistema de Gestão Condominial</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {user?.name}!</CardTitle>
            <CardDescription>
              {user?.role === 'admin' || user?.role === 'sindico' 
                ? 'Você tem acesso total ao sistema. Use o menu lateral para gerenciar o condomínio.'
                : 'Você tem acesso restrito. Utilize as funcionalidades disponíveis para sua unidade.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Gerencie informações de condôminos e unidades</p>
              <p>• Controle de garagens e sorteios</p>
              <p>• Administre utensílios do salão de festas</p>
              <p>• Comunique-se com outros condôminos via chat</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
