'use client';

import { RoleGate } from "@/components/auth/role-gate";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { UserRole, VisitState } from "@prisma/client";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface CustomRoute {
  id: string;
  title: string;
  description: string | null;
  link: string;
  status: VisitState;
  createdAt: string;
  creator: {
    name: string | null;
    email: string | null;
  };
  parts: any;
}

const AdminRoutesPage = () => {
  const user = useCurrentUser();
  const role = useCurrentRole();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [routes, setRoutes] = useState<CustomRoute[]>([]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/admin/routes');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/routes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action })
        });

        if (response.ok) {
          toast({
            title: "Úspěch",
            description: `Trasa byla ${action === 'approve' ? 'schválena' : 'zamítnuta'}.`,
            variant: "success"
          });
          fetchRoutes();
        } else {
          throw new Error('Failed to update');
        }
      } catch (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se aktualizovat stav trasy.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
      <RoleGate allowedRole={UserRole.ADMIN}>
        <div className="max-w-4xl mx-auto p-4 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Strakaté trasy</h1>
              <p className="text-muted-foreground">Schvalování uživatelských tras</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trasy ke schválení</CardTitle>
              <CardDescription>Seznam tras čekajících na kontrolu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Žádné trasy ke schválení</p>
                ) : (
                  routes.map((route) => (
                    <div key={route.id} className="p-4 border rounded-lg bg-card space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            {route.title}
                            <Badge variant="outline">{route.status}</Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vytvořil: {route.creator.name || route.creator.email} • {format(new Date(route.createdAt), "d. M. yyyy", { locale: cs })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction(route.id, 'approve')}
                            disabled={isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Schválit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(route.id, 'reject')}
                            disabled={isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Zamítnout
                          </Button>
                        </div>
                      </div>

                      {route.description && (
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {route.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={route.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Otevřít mapu
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGate>
    </CommonPageTemplate>
  );
};

export default AdminRoutesPage;