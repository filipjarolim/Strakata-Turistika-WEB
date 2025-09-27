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
      <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-5xl px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Vytvořit Soutěž</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nová Soutěž</CardTitle>
            <CardDescription>
              Vytvořte novou soutěž s vlastní trasou nebo použijte předpřipravenou trasu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Název soutěže</Label>
                <Input id="name" placeholder="Zadejte název soutěže" className="text-sm sm:text-base" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea id="description" placeholder="Popište soutěž" className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Trasa</Label>
                <Select>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Vyberte trasu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy-trail">Easy Hiking Trail</SelectItem>
                    <SelectItem value="mountain-trail">Mountain Trail</SelectItem>
                    <SelectItem value="custom">Vlastní trasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum konání</Label>
                  <Input id="date" type="date" className="text-sm sm:text-base" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Čas startu</Label>
                  <Input id="time" type="time" className="text-sm sm:text-base" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button type="submit" className="w-full sm:w-auto">Vytvořit soutěž</Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
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
