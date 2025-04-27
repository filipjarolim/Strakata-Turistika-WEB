import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface TitleTemplateProps {
  title: string;
  description?: string;
  breadcrumbItems?: {
    label: string;
    href: string;
  }[];
}

const TitleTemplate: React.FC<TitleTemplateProps> = ({
  title,
  description,
  breadcrumbItems = [
    { label: "Domů", href: "/" }
  ]
}) => {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Page header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-lg text-muted-foreground max-w-3xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleTemplate; 