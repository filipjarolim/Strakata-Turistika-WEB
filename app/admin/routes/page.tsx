'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitState } from '@prisma/client';

// Import GPX Editor dynamically to handle SSR
const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }
);

interface Route {
  id: string;
  routeTitle: string;
  routeDescription: string;
  routeLink: string;
  visitDate: string;
  year: number;
  state: VisitState;
  extraPoints: {
    description: string;
    distance: number;
    elapsedTime: number;
    averageSpeed: number;
  };
  createdAt: string;
}

export default function AdminRoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRoute, setProcessingRoute] = useState<string | null>(null);

  const checkAdminAndFetchRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/routes');
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch routes');
      }
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAndFetchRoutes();
  }, [checkAdminAndFetchRoutes]);

  const handleApprove = async (routeId: string) => {
    try {
      setProcessingRoute(routeId);
      const response = await fetch(`/api/admin/routes/${routeId}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to approve route');
      await checkAdminAndFetchRoutes(); // Refresh the list
    } catch (err) {
      setError('Failed to approve route');
    } finally {
      setProcessingRoute(null);
    }
  };

  const handleReject = async (routeId: string) => {
    try {
      setProcessingRoute(routeId);
      const response = await fetch(`/api/admin/routes/${routeId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: 'Rejected by admin'
        })
      });
      if (!response.ok) throw new Error('Failed to reject route');
      await checkAdminAndFetchRoutes(); // Refresh the list
    } catch (err) {
      setError('Failed to reject route');
    } finally {
      setProcessingRoute(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">Route Approvals</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle>{route.routeTitle}</CardTitle>
              <CardDescription>
                Submitted on {new Date(route.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {route.routeDescription}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(route.id)}
                      disabled={processingRoute === route.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processingRoute === route.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(route.id)}
                      disabled={processingRoute === route.id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {processingRoute === route.id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
                <div className="aspect-[16/9] w-full">
                  <DynamicGpxEditor
                    onSave={() => {}}
                    initialTrack={JSON.parse(route.routeLink)}
                    readOnly={true}
                    hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify']}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 