import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [openNewGroup, setOpenNewGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '', isPublic: true });

  const { data: groups, refetch: refetchGroups } = trpc.chat.groups.list.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.chat.messages.getByGroup.useQuery(
    { groupId: selectedGroupId || 0, limit: 50 },
    { enabled: selectedGroupId !== null }
  );

  const sendMessageMutation = trpc.chat.messages.send.useMutation({
    onSuccess: () => {
      setMessageInput('');
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createGroupMutation = trpc.chat.groups.create.useMutation({
    onSuccess: () => {
      toast.success('Grupo criado com sucesso');
      setNewGroupData({ name: '', description: '', isPublic: true });
      setOpenNewGroup(false);
      refetchGroups();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMessageMutation = trpc.chat.messages.delete.useMutation({
    onSuccess: () => {
      toast.success('Mensagem removida');
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico';

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedGroupId) {
      toast.error('Digite uma mensagem');
      return;
    }
    sendMessageMutation.mutate({
      groupId: selectedGroupId,
      message: messageInput,
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupData.name) {
      toast.error('Digite o nome do grupo');
      return;
    }
    createGroupMutation.mutate(newGroupData);
  };

  // Auto-select first group
  useEffect(() => {
    if (groups && groups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chat Condominial</h1>
            <p className="text-muted-foreground mt-2">Comunique-se com outros condôminos</p>
          </div>
          {isAdmin && (
            <Dialog open={openNewGroup} onOpenChange={setOpenNewGroup}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={20} />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Grupo de Chat</DialogTitle>
                  <DialogDescription>
                    Crie um novo grupo para comunicação
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Nome do Grupo</Label>
                    <Input
                      id="groupName"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                      placeholder="Ex: Geral, Manutenção, etc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                      placeholder="Descrição do grupo"
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Criar Grupo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Groups Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groups?.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 text-foreground'
                    }`}
                  >
                    <p className="font-medium text-sm">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {groups?.find((g) => g.id === selectedGroupId)?.name || 'Selecione um grupo'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-96">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4 border border-border rounded-lg p-4">
                <div className="space-y-3">
                  {messages?.map((message) => (
                    <div key={message.id} className="flex gap-3 group">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Condômino</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => deleteMessageMutation.mutate({ id: message.id })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
