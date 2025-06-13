import React from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

export default async function VytvoritPage() {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role}>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Vytvořit Soutěž</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nová Soutěž</CardTitle>
            <CardDescription>
              Vytvořte novou soutěž s vlastní trasou nebo použijte předpřipravenou trasu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Název soutěže</Label>
                <Input id="name" placeholder="Zadejte název soutěže" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea id="description" placeholder="Popište soutěž" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Trasa</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte trasu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy-trail">Easy Hiking Trail</SelectItem>
                    <SelectItem value="mountain-trail">Mountain Trail</SelectItem>
                    <SelectItem value="custom">Vlastní trasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum konání</Label>
                <Input id="date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Čas startu</Label>
                <Input id="time" type="time" />
              </div>

              <div className="flex gap-4">
                <Button type="submit">Vytvořit soutěž</Button>
                <Button variant="outline" asChild>
                  <a href="/soutez/nahrat">Nahrát vlastní trasu</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </CommonPageTemplate>
  );
}
