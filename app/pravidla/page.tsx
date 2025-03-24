import React from 'react'
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Calendar, Clock, Award, Camera, Info, Play, Palmtree, Check, FilePen } from "lucide-react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { PhotoSubmissionFormWrapper } from '@/components/forms/PhotoSubmissionForm';

// Competition rules data
const rules = {
  importantUpdate: "NOVINKA: LETOS JE POVOLENA POUZE CHŮZE! Žádný dopravní prostředek (kolo, loď, běžky).",
  sections: [
    {
      id: "zakladni-pravidla",
      title: "Základní pravidla a bodování",
      icon: <Award className="h-5 w-5" />,
      content: [
        "Trasa musí měřit nejméně 3 km (netýká se tématu měsíce) a na trase musíte navštívit alespoň 1 bodované místo.",
        "Nejmenší počet bodů: 4 (3 za kilometry + 1 za místo).",
        "Počet tras ušlých za jeden den není nijak omezen.",
        "Body se dávají i za desetiny kilometru - trasa 6,8 km znamená 6,8 bodů.",
        "Povolená je jen CHŮZE, žádný dopravní prostředek, jen své nohy."
      ]
    },
    {
      id: "prokazovani",
      title: "Prokazování tras a zasílání fotek",
      icon: <Camera className="h-5 w-5" />,
      content: [
        "Jako důkaz ušlých km posílejte screen nebo odkaz z aplikace (Stopař, Strava, chytré hodinky).",
        "Dále posílejte fotky z bodovaných míst jako jste byli zvyklí doposud.",
        "Pro zasílání fotek používejte nejlépe formulář zde na stránce.",
        "Fotka nesmí být starší 14 dní, jinak nemusí být uznána!",
        "Soutěžící účastí v soutěži souhlasí se zveřejněním fotek se svým jménem na veřejné síti Rajce.net."
      ]
    },
    {
      id: "bodovani-mist",
      title: "Bodování míst a opakované trasy",
      icon: <MapPin className="h-5 w-5" />,
      content: [
        "Za každé navštívené místo ze seznamu získáte příslušné body.",
        "Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou (kromě sekce Strakáč zve).",
        "Pokud půjdete trasu, na které se nachází více bodovaných míst, je možné si body 'pošetřit'.",
        "Pokud půjdete víckrát, tak nikdy nesmí být trasa úplně stejná - musí být změněná, delší, zkrácená, přidaná cesta apod."
      ]
    },
    {
      id: "terminy",
      title: "Termíny a podmínky",
      icon: <Calendar className="h-5 w-5" />,
      content: [
        "Soutěž je pro členy Spolku českého strakatého psa.",
        "Bodovací období je od 1. 11. 2024 do 31. 10. 2025.",
        "Konec ročníku 2025 je 31. 10. 2025 24:00 hod.! - poslední termín pro zaslání fotky.",
        "Organizátoři si vyhrazují právo na úpravu pravidel v průběhu soutěže."
      ]
    },
    {
      id: "vyjimky",
      title: "Výjimky a speciální případy",
      icon: <FilePen className="h-5 w-5" />,
      content: [
        "Pro psí (i lidské) seniory, psy (i lidi) v rekonvalescenci, psy (i lidi) s handicapem apod. je v odůvodněných případech možné udělit výjimku.",
        "V případě, že se zúčastníte dogtrekingu, canicrossu či jiného závodu a navštívíte bodová místa, tak je možné body do ST použít, ale už nebudete moct bodovat s tím samým závodem v pracovním strakáči."
      ]
    },
    {
      id: "rovnost-bodu",
      title: "Rovnost bodů",
      icon: <Award className="h-5 w-5" />,
      content: [
        "Při rovnosti bodů za celé bodovací období rozhoduje:",
        "1) počet ušlých kilometrů",
        "2) počet bodů za navštívená místa"
      ]
    }
  ],
  faq: [
    {
      question: "Mohu poslat fotku starší než 14 dní?",
      answer: "Ne, fotka nesmí být starší 14 dní, jinak nemusí být uznána. Poslední termín pro zaslání fotky je nejpozději do 31. 10. 2025 24:00 hod."
    },
    {
      question: "Co když navštívím místo, které se neboduje, ale je hezké?",
      answer: "Pokud na trase narazíte na místo, které se neboduje, ale je hezké a váš pes hezky zapózuje, pošlete fotku s textem 'FOTO Z TRASY'. Může být vybrána do kalendáře!"
    },
    {
      question: "Co když je bodované místo nedostupné?",
      answer: "Může se stát, že bodované místo bude nedostupné a tudíž se nemůže uznat. Je tedy potřeba si předem doma projít mapu a zkontrolovat místa, abyste se nevydali na výšlap a až na místě zjistili, že se objekt nachází například v klidové zóně národního parku."
    },
    {
      question: "Mohu navštívit stejné místo vícekrát?",
      answer: "Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou. Výjimku tvoří sekce Strakáč zve, kde platí upravená pravidla."
    },
    {
      question: "Existují výjimky z pravidla minimální délky 3 km?",
      answer: "Ano, minimální délka 3 km se nevztahuje na téma měsíce. Také pro psí (i lidské) seniory nebo účastníky s handicapem je možné v odůvodněných případech udělit výjimku."
    }
  ]
};

// Server component
const Page = async () => {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Domů</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pravidla">Pravidla</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Page header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Pravidla Strakaté turistiky</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Vítejte v Strakaté turistice 2024/2025! Níže najdete kompletní přehled pravidel a informací k soutěži.
          </p>
        </div>
        
        {/* Important update alert */}
        <Card className="mt-8 border-red-500 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Důležitá novinka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 font-medium">{rules.importantUpdate}</p>
          </CardContent>
        </Card>
        
        {/* Main content */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Tabs defaultValue="sekce" className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="sekce">Sekce pravidel</TabsTrigger>
                <TabsTrigger value="faq">Časté otázky</TabsTrigger>
              </TabsList>
              
              {/* Rules sections tab */}
              <TabsContent value="sekce" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {rules.sections.slice(0, 4).map((section) => (
                    <Link href={`#${section.id}`} key={section.id}>
                      <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {section.icon}
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {section.content[0]}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                <Accordion type="multiple" className="w-full">
                  {rules.sections.map((section, index) => (
                    <AccordionItem value={section.id} key={section.id} id={section.id}>
                      <AccordionTrigger className="text-xl font-semibold flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          {section.icon}
                          {section.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8">
                        <ul className="space-y-3">
                          {section.content.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              
              {/* FAQ tab */}
              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle>Nejčastější otázky</CardTitle>
                    <CardDescription>
                      Odpovědi na nejčastější dotazy ohledně Strakaté turistiky
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {rules.faq.map((item, index) => (
                        <AccordionItem value={`faq-${index}`} key={index}>
                          <AccordionTrigger className="text-lg font-medium">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar with form */}
          <div>
            <div className="sticky top-20">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Odeslat fotky z trasy</CardTitle>
                  <CardDescription>
                    Nahrání fotek z bodovaných míst a tras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoSubmissionFormWrapper />
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
                  <p>Fotky zasílejte do 14 dnů od pořízení</p>
                </CardFooter>
              </Card>
              
              {/* Quick links */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Užitečné odkazy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/mapa" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Mapa bodovaných míst
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/zebricek" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Aktuální žebříček
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/tema-mesice" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Téma měsíce
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/vyjimky" className="flex items-center gap-2">
                      <FilePen className="h-4 w-4" />
                      Žádost o výjimku
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default Page;
