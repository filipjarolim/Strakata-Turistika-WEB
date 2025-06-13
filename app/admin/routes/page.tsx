'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, X } from "lucide-react";
import dynamic from 'next/dynamic';

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
  fullName: string;
  description: string;
  routeLink: string;
  visitDate: string;
  year: number;
  extraPoints: {
    description: string;
    distance: number;
    elapsedTime: number;
    averageSpeed: number;
  };
}

export default function AdminRoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminAndFetchRoutes = useCallback(async () => {
    try {
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
    }
  }, [router]);

  useEffect(() => {
    checkAdminAndFetchRoutes();
  }, [checkAdminAndFetchRoutes]);

  const handleApprove = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to approve route');
      await checkAdminAndFetchRoutes(); // Refresh the list
    } catch (err) {
      setError('Failed to approve route');
    }
  };

  const handleReject = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Rejected by admin'
        })
      });
      if (!response.ok) throw new Error('Failed to reject route');
      await checkAdminAndFetchRoutes(); // Refresh the list
    } catch (err) {
      setError('Failed to reject route');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">Loading...</div>
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
              <CardTitle>{route.fullName}</CardTitle>
              <CardDescription>
                Submitted on {new Date(route.visitDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {route.extraPoints.description}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(route.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(route.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="aspect-[16/9] w-full">
                  <DynamicGpxEditor
                    onSave={() => {}}
                    initialTrack={JSON.parse(route.routeLink)}
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