import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-modern";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { getActiveUsers, ActiveUser } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { sendTextMessage } from "../api/evolution.api";

type Step = "select" | "message" | "review" | "sending";

type SendStatus = "aguardando" | "enviando" | "enviado" | "falhou";

interface UserWithStatus extends ActiveUser {
  status: SendStatus;
  error?: string;
}

const MassMessageManager: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [usersWithStatus, setUsersWithStatus] = useState<UserWithStatus[]>([]);
  const [isSending, setIsSending] = useState(false);

  const loadActiveUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeUsers = await getActiveUsers();
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading active users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários ativos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadActiveUsers();
  }, [loadActiveUsers]);

  const handleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleNextToMessage = () => {
    if (selectedUserIds.size === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um usuário para continuar.",
        variant: "destructive",
      });
      return;
    }
    setStep("message");
  };

  const handleNextToReview = () => {
    if (!message.trim()) {
      toast({
        title: "Atenção",
        description: "Digite uma mensagem para continuar.",
        variant: "destructive",
      });
      return;
    }
    setStep("review");
  };

  const handleBack = () => {
    if (step === "message") {
      setStep("select");
    } else if (step === "review") {
      setStep("message");
    }
  };

  const handleSend = async () => {
    const selectedUsers = users.filter((u) => selectedUserIds.has(u.id));
    const usersWithStatusData: UserWithStatus[] = selectedUsers.map((user) => ({
      ...user,
      status: "aguardando" as SendStatus,
    }));

    setUsersWithStatus(usersWithStatusData);
    setStep("sending");
    setIsSending(true);

    // Send messages sequentially
    for (let i = 0; i < usersWithStatusData.length; i++) {
      const user = usersWithStatusData[i];

      // Update status to "enviando"
      setUsersWithStatus((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "enviando" } : u))
      );

      try {
        // Check if user has a phone number
        if (!user.phone) {
          setUsersWithStatus((prev) =>
            prev.map((u) => ({
              ...u,
              status: "falhou",
              error: "Usuário não possui número de telefone cadastrado.",
            }))
          );
          continue;
        }

        // Format phone number (remove special characters, keep only digits)
        const phoneNumber = user.phone.replace(/\D/g, "");

        // Make POST request to Evolution API
        const response = await sendTextMessage(phoneNumber, message);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.message ||
              `Erro ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Check if the response indicates success
        if (data?.status === "success" || response.ok) {
          setUsersWithStatus((prev) =>
            prev.map((u) =>
              u.id === user.id ? { ...u, status: "enviado" } : u
            )
          );
        } else {
          throw new Error(data?.message || "Falha ao enviar mensagem");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        setUsersWithStatus((prev) =>
          prev.map((u) => ({
            ...u,
            status: "falhou",
            error: errorMessage,
          }))
        );
      }

      // Add 10 second delay between messages (except after the last one)
      if (i < usersWithStatusData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    setIsSending(false);
    toast({
      title: "Envio concluído",
      description: `Mensagens processadas para ${selectedUsers.length} usuários.`,
    });
  };

  const getStatusBadge = (status: SendStatus) => {
    switch (status) {
      case "aguardando":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
        );
      case "enviando":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Enviando
          </Badge>
        );
      case "enviado":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case "falhou":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
    }
  };

  const selectedUsers = users.filter((u) => selectedUserIds.has(u.id));

  return (
    <div className="w-full space-y-6">
      {/* Step 1: User Selection */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selecionar Usuários
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedUserIds.size === users.length
                    ? "Desmarcar Todos"
                    : "Selecionar Todos"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">
                  Carregando usuários...
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum usuário ativo encontrado.
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-slate-600">
                  {selectedUserIds.size} de {users.length} usuários selecionados
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUser(user.id)}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">
                            {user.name || "Sem nome"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {user.phone || "Sem telefone"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleNextToMessage}
                    disabled={selectedUserIds.size === 0}
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Message Input */}
      {step === "message" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Escrever Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Mensagem será enviada para{" "}
                  <strong>{selectedUsers.length}</strong> usuário
                  {selectedUsers.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-slate-500">
                  {message.length} caracteres
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleNextToReview} disabled={!message.trim()}>
                  Revisar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Revisar Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Mensagem:
                </p>
                <p className="text-slate-900 whitespace-pre-wrap">{message}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  A mensagem será enviada para{" "}
                  <strong>{selectedUsers.length}</strong> usuário
                  {selectedUsers.length !== 1 ? "s" : ""}.
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSend}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Sending Status */}
      {step === "sending" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Envio em Massa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const allComplete = usersWithStatus.every(
                  (u) => u.status === "enviado" || u.status === "falhou"
                );
                const completedCount = usersWithStatus.filter(
                  (u) => u.status === "enviado" || u.status === "falhou"
                ).length;

                return (
                  <div
                    className={`p-4 rounded-lg border ${
                      allComplete
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        allComplete ? "text-green-800" : "text-blue-800"
                      }`}
                    >
                      {allComplete
                        ? "Envio de mensagens completado!"
                        : `Enviando mensagens... (${completedCount}/${usersWithStatus.length})`}
                    </p>
                  </div>
                );
              })()}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {usersWithStatus.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {user.name || "Sem nome"}
                        </span>
                        {getStatusBadge(user.status)}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.status === "falhou" && user.error && (
                          <div className="mt-2 text-red-600 text-xs">
                            <strong>Erro:</strong> {user.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!isSending && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setStep("select");
                      setSelectedUserIds(new Set());
                      setMessage("");
                      setUsersWithStatus([]);
                    }}
                  >
                    Nova Mensagem
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MassMessageManager;
