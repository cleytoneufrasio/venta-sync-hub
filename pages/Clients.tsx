import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

const Clients = () => {
  // SEO básico
  useEffect(() => {
    document.title = "Clientes | Cadastro de Clientes";
  }, []);

  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const from = useMemo(() => (page - 1) * PAGE_SIZE, [page]);
  const to = useMemo(() => from + PAGE_SIZE - 1, [from]);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", { search, page }],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("id, user_id, name, email, phone, address, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        // Busca por nome ou email
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data as Client[]) ?? [], count: count ?? 0 };
    },
  });

  const total = data?.count ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Formulário (criar/editar)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setName(c.name ?? "");
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setAddress(c.address ?? "");
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Não autenticado");
      const { error } = await supabase.from("clients").insert({
        user_id: userId,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Cliente criado com sucesso");
      setOpen(false);
      resetForm();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["clients"] }),
        qc.invalidateQueries({ queryKey: ["count", "clients"] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar cliente"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("clients")
        .update({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Cliente atualizado");
      setOpen(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar cliente"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Cliente removido");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["clients"] }),
        qc.invalidateQueries({ queryKey: ["count", "clients"] }),
      ]);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover cliente"),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="max-w-6xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-semibold">Clientes</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus clientes (criar, editar e excluir).</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Lista de clientes</CardTitle>
            <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); setOpen(o); }}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>Novo cliente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, cidade" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                  <Button
                    onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
                    disabled={!name.trim() || saving}
                  >
                    {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <Input
                placeholder="Buscar por nome"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                aria-label="Buscar clientes"
              />
              <div className="text-sm text-muted-foreground">{total} resultado(s)</div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    rows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email ?? "-"}</TableCell>
                        <TableCell>{c.phone ?? "-"}</TableCell>
                        <TableCell>{c.address ?? "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(c.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? "Removendo..." : "Excluir"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
              <div className="text-sm text-muted-foreground">Página {page} de {totalPages}</div>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Próxima</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Clients;
