'use client';

import React, { useState, useEffect } from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import TitleTemplate from "@/components/structure/TitleTemplate";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { useSession } from "next-auth/react";

const Page = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("<p>Načítání obsahu...</p>");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/rules');
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };

    fetchContent();
  }, []);

  return (
    <CommonPageTemplate contents={{complete: true}}>
      <TitleTemplate
        title="Pravidla Strakaté turistiky"
        description="Vítejte v Strakaté turistice 2024/2025! Níže najdete kompletní přehled pravidel a informací k soutěži."
        breadcrumbItems={[
          { label: "Domů", href: "/" },
          { label: "Pravidla", href: "/pravidla" }
        ]}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <Eye className="h-4 w-4" />
                  Zobrazit
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Upravit
                </>
              )}
            </Button>
          </div>
        )}

        <TiptapEditor
          content={content}
          isEditable={isEditing}
          onSave={async (newContent) => {
            try {
              const response = await fetch('/api/rules', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent }),
              });

              if (!response.ok) {
                throw new Error('Failed to save content');
              }

              setContent(newContent);
              setIsEditing(false);
            } catch (error) {
              console.error('Error saving content:', error);
            }
          }}
        />
      </div>
    </CommonPageTemplate>
  );
};

export default Page;
