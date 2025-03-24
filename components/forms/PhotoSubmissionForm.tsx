"use client";

import React from 'react';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast"; // Fixed import from hooks instead of components

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Jméno musí mít alespoň 2 znaky" }),
  email: z.string().email({ message: "Neplatná emailová adresa" }),
  message: z.string().min(5, { message: "Zpráva musí mít alespoň 5 znaků" }),
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Soubor je povinný",
  }),
});

// Define the type for our form values
type FormValues = z.infer<typeof formSchema>;

// Client-side form component
export const PhotoSubmissionForm = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      // Form submission logic would go here
      console.log(values);
      
      // Here you would typically:
      // 1. Create a FormData object if uploading files
      // 2. Send a POST request to your API endpoint
      // 3. Show success/error messages

      // Simulating a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast({
        title: "Úspěch!",
        description: "Formulář byl úspěšně odeslán!",
      });
      
      // Reset form after submission
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Chyba!",
        description: "Nastala chyba při odesílání formuláře. Zkuste to prosím znovu.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jméno a příjmení</FormLabel>
              <FormControl>
                <Input placeholder="Vaše jméno a příjmení" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="vas@email.cz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Nahrát soubor</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      onChange(files);
                    }
                  }}
                  {...fieldProps}
                />
              </FormControl>
              <FormDescription>
                Přiložte fotografii z turistické trasy
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zpráva</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Uveďte: jméno psa, datum, název místa, délku trasy a další relevantní informace"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                K fotce je potřeba doplnit: Jméno majitele + psa (oficiální i volací), 
                datum, název místa. Pokud je místo "vícebodové", napište všechny možnosti.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Odesílám..." : "Odeslat"}
        </Button>
      </form>
    </Form>
  );
};

// Wrapper component to use in server components
export const PhotoSubmissionFormWrapper = () => {
  return <PhotoSubmissionForm />;
}; 