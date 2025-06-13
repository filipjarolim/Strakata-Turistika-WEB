import React from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Map } from "lucide-react";
import Link from "next/link";

// Make page static with long revalidation for offline access
export const revalidate = 2592000; // 30 days in seconds

const sampleRoutes = [
  {
    name: "Easy Hiking Trail",
    description: "A beginner-friendly 5km hiking trail",
    file: "/sample-routes/easy-trail.gpx",
    difficulty: "Easy"
  },
  {
    name: "Mountain Trail",
    description: "A challenging 10km mountain trail with significant elevation changes",
    file: "/sample-routes/mountain-trail.gpx",
    difficulty: "Hard"
  }
];

const GPSPage = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role}>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Map className="h-6 w-6" />
          <h1 className="text-3xl font-bold">GPS Trasy</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sampleRoutes.map((route) => (
            <Card key={route.name}>
              <CardHeader>
                <CardTitle>{route.name}</CardTitle>
                <CardDescription>{route.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Difficulty:</span>
                  <span className="text-sm text-muted-foreground">{route.difficulty}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={route.file} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download GPX
                    </a>
                  </Button>
                  <Button asChild variant="default" size="sm">
                    <Link href="/soutez/nahrat">
                      <Map className="h-4 w-4 mr-2" />
                      Edit Route
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default GPSPage;
