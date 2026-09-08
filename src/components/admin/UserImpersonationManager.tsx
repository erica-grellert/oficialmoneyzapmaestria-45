import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, Trash2, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-modern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useImpersonation } from "@/hooks/useImpersonation";
import {
  deleteUserCompletely,
  listImpersonationUsers,
  type ImpersonationUser,
} from "@/lib/impersonation";

const UserImpersonationManager: React.FC = () => {
  const { toast } = useToast();
  const { isStarting, startImpersonation } = useImpersonation();
  const [users, setUsers] = useState<ImpersonationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingUser, setPendingUser] = useState<ImpersonationUser | null>(
    null
  );
  const [userToDelete, setUserToDelete] = useState<ImpersonationUser | null>(
    null
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await listImpersonationUsers();
      setUsers(list);
    } catch (error) {
      console.error("Error loading users for impersonation:", error);
      toast({
        title: "Erro ao carregar usuários",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível listar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? "";
      const email = user.email.toLowerCase();
      const phone = user.phone ?? "";
      return (
        name.includes(term) || email.includes(term) || phone.includes(term)
      );
    });
  }, [query, users]);

  const handleConfirm = async () => {
    if (!pendingUser) return;
    try {
      await startImpersonation(pendingUser.id);
    } catch (error) {
      toast({
        title: "Não foi possível entrar como este usuário",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setPendingUser(null);
    }
  };

  const canConfirmDelete =
    !!userToDelete &&
    deleteConfirmation.trim().toLowerCase() ===
      userToDelete.email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!userToDelete || !canConfirmDelete) return;
    try {
      setIsDeleting(true);
      await deleteUserCompletely(userToDelete.id);
      setUsers((current) =>
        current.filter((user) => user.id !== userToDelete.id)
      );
      toast({
        title: "Usuário excluído",
        description: `${userToDelete.email} foi removido do app e da autenticação.`,
      });
      setUserToDelete(null);
      setDeleteConfirmation("");
    } catch (error) {
      toast({
        title: "Não foi possível excluir o usuário",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5 text-amber-600" />
            Ver como um usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Entre na conta de um usuário para ver exatamente o que ele vê.
            Qualquer alteração feita nessa sessão vale de verdade na conta
            dele. Também é possível excluir um usuário de forma permanente,
            inclusive o login no Supabase Authentication.
          </p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {user.name || user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {user.role === "admin" && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    {!user.is_active && (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                    {user.canDelete && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={isDeleting}
                        aria-label={`Excluir ${user.name || user.email}`}
                        onClick={() => {
                          setDeleteConfirmation("");
                          setUserToDelete(user);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!user.canImpersonate || isStarting}
                      onClick={() => setPendingUser(user)}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Ver como
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingUser}
        onOpenChange={(open) => {
          if (!open && !isStarting) setPendingUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entrar como este usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Você vai ver o app como{" "}
              <strong>
                {pendingUser?.name || pendingUser?.email}
              </strong>
              . Transações, metas e configurações que você alterar ficam na
              conta dele. Use só para suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>
              Cancelar
            </AlertDialogCancel>
            <Button onClick={handleConfirm} disabled={isStarting}>
              {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setUserToDelete(null);
            setDeleteConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este usuário de vez?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove{" "}
              <strong>{userToDelete?.name || userToDelete?.email}</strong> do
              app, apaga transações, metas, categorias e assinatura, e também
              exclui o login no Supabase Authentication. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-user-email">
              Digite o e-mail <strong>{userToDelete?.email}</strong> para
              confirmar
            </Label>
            <Input
              id="delete-user-email"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleDelete();
                }
              }}
              placeholder={userToDelete?.email}
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!canConfirmDelete || isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir definitivamente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserImpersonationManager;
