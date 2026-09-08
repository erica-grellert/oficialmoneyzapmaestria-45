import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  Eye,
  Loader2,
  Search,
  Trash2,
  Users,
  Shield,
  CircleSlash,
} from "lucide-react";
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
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";
import {
  deleteUserCompletely,
  listImpersonationUsers,
  type ImpersonationUser,
} from "@/lib/impersonation";

const UserImpersonationManager: React.FC = () => {
  const { toast } = useToast();
  const { isStarting, startImpersonation } = useImpersonation();
  const reducedMotion = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!listRef.current || isLoading || reducedMotion) return;
    const rows = listRef.current.querySelectorAll("[data-user-row]");
    if (!rows.length) return;
    gsap.fromTo(
      rows,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.03,
        ease: "power2.out",
      }
    );
  }, [filteredUsers, isLoading, reducedMotion]);

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
      <section className="space-y-5">
        <header className="admin-surface overflow-hidden p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="admin-kicker">Operações de usuário</p>
              <h2 className="admin-display mt-2 text-3xl md:text-4xl">
                Ver como um usuário
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--admin-muted)] md:text-base">
                Entre na conta de um usuário para ver exatamente o que ele vê.
                Alterações feitas nessa sessão valem de verdade. A exclusão
                permanente também remove o login no Supabase Authentication.
              </p>
            </div>
            <div className="admin-gold-chip">
              <Users className="h-3.5 w-3.5" />
              {filteredUsers.length} resultado
              {filteredUsers.length === 1 ? "" : "s"}
            </div>
          </div>
        </header>

        <div className="admin-surface p-4 md:p-5">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
              className="h-11 rounded-xl border-[var(--admin-line-strong)] bg-white/80 pl-9"
              aria-label="Buscar usuários"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-14 text-[var(--admin-muted)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="rounded-full border border-[var(--admin-line)] bg-white/70 p-3">
                <CircleSlash className="h-5 w-5 text-[var(--admin-muted)]" />
              </div>
              <p className="text-sm text-[var(--admin-muted)]">
                Nenhum usuário encontrado.
              </p>
            </div>
          ) : (
            <div ref={listRef} className="max-h-[28rem] space-y-2.5 overflow-y-auto pr-1">
              {filteredUsers.map((user) => (
                <article
                  key={user.id}
                  data-user-row
                  className="admin-user-row"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-[var(--admin-ink)]">
                        {user.name || user.email}
                      </p>
                      {user.role === "admin" && (
                        <Badge className="bg-[var(--admin-gold-soft)] text-[#854d0e] hover:bg-[var(--admin-gold-soft)]">
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {!user.is_active && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--admin-muted)] md:text-sm">
                      {user.email}
                      {user.phone ? ` · ${user.phone}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    {user.canDelete && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-[var(--admin-danger)] hover:bg-orange-50 hover:text-[var(--admin-danger)]"
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
                      className="admin-button-ink rounded-xl"
                      disabled={!user.canImpersonate || isStarting}
                      onClick={() => setPendingUser(user)}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Ver como
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <AlertDialog
        open={!!pendingUser}
        onOpenChange={(open) => {
          if (!open && !isStarting) setPendingUser(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-[var(--admin-line)] bg-[var(--admin-paper-elevated)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="admin-display text-2xl">
              Entrar como este usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você vai ver o app como{" "}
              <strong>{pendingUser?.name || pendingUser?.email}</strong>.
              Transações, metas e configurações que você alterar ficam na conta
              dele. Use só para suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleConfirm}
              disabled={isStarting}
              className="admin-button-ink"
            >
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
        <AlertDialogContent className="rounded-2xl border-[var(--admin-line)] bg-[var(--admin-paper-elevated)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="admin-display text-2xl">
              Excluir este usuário de vez?
            </AlertDialogTitle>
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
              className="rounded-xl"
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
