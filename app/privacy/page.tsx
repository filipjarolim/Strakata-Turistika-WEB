import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { currentUser, currentRole } from '@/lib/auth';
import { Shield, Lock, Eye, User, Mail, Clock, FileText, Phone, MapPin, Building } from 'lucide-react';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSCircleIcon } from '@/components/ui/ios/circle-icon';
import { IOSSection } from '@/components/ui/ios/section';
import { cn } from '@/lib/utils';

interface ContactData {
  name: string;
  email: string;
  address: string;
}

interface ListData {
  subtitle: string;
  items: string[];
}

interface SectionContent {
  type?: 'contact' | 'list' | 'text_with_list' | 'lists';
  data?: ContactData | ListData[];
  items?: string[];
  text?: string;
}

interface PrivacySection {
  title: string;
  icon: React.ReactNode;
  content: string | SectionContent;
  id: string;
}

export default async function PrivacyPage() {
  const user = await currentUser();
  const role = await currentRole();

  // 1. Define a color/icon variant map for sections
  const sectionVariants: {
    iconBg: string;
    iconColor: string;
    circle: "default" | "amber" | "blue" | "red";
    cardGradient: string;
    tocHoverGradient: string;
  }[] = [
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', circle: 'blue', cardGradient: 'from-blue-50/40 to-white', tocHoverGradient: 'hover:from-blue-50 hover:to-white' },
    { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', circle: 'amber', cardGradient: 'from-amber-50/40 to-white', tocHoverGradient: 'hover:from-amber-50 hover:to-white' },
    { iconBg: 'bg-red-100', iconColor: 'text-red-600', circle: 'red', cardGradient: 'from-red-50/40 to-white', tocHoverGradient: 'hover:from-red-50 hover:to-white' },
    { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', circle: 'default', cardGradient: 'from-gray-100/40 to-white', tocHoverGradient: 'hover:from-gray-100 hover:to-white' },
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', circle: 'blue', cardGradient: 'from-blue-50/40 to-white', tocHoverGradient: 'hover:from-blue-50 hover:to-white' },
    { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', circle: 'amber', cardGradient: 'from-amber-50/40 to-white', tocHoverGradient: 'hover:from-amber-50 hover:to-white' },
    { iconBg: 'bg-red-100', iconColor: 'text-red-600', circle: 'red', cardGradient: 'from-red-50/40 to-white', tocHoverGradient: 'hover:from-red-50 hover:to-white' },
    { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', circle: 'default', cardGradient: 'from-gray-100/40 to-white', tocHoverGradient: 'hover:from-gray-100 hover:to-white' },
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', circle: 'blue', cardGradient: 'from-blue-50/40 to-white', tocHoverGradient: 'hover:from-blue-50 hover:to-white' },
    { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', circle: 'amber', cardGradient: 'from-amber-50/40 to-white', tocHoverGradient: 'hover:from-amber-50 hover:to-white' },
  ];

  const sections: PrivacySection[] = [
    {
      id: 'uvod',
      title: 'Úvod',
      icon: <FileText className="h-5 w-5" />,
      content: 'Strakatá Turistika respektuje vaše soukromí a zavazuje se chránit vaše osobní údaje. Tyto zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme a chráníme vaše informace při používání naší aplikace a webových stránek.'
    },
    {
      id: 'spravce',
      title: 'Správce osobních údajů',
      icon: <Building className="h-5 w-5" />,
      content: {
        type: 'contact',
        data: {
          name: 'Strakatá Turistika',
          email: 'privacy@strakataturistika.cz',
          address: '[Vaše adresa]'
        } as ContactData
      }
    },
    {
      id: 'udaje',
      title: 'Jaké údaje shromažďujeme',
      icon: <Eye className="h-5 w-5" />,
      content: {
        type: 'lists',
        data: [
          {
            subtitle: 'Údaje poskytnuté vámi',
            items: [
              'Jméno a emailová adresa při registraci',
              'Profilové informace a fotografie',
              'GPS data a trasy, které nahrajete',
              'Fotografie a komentáře k trasám',
              'Komunikace s našim týmem'
            ]
          },
          {
            subtitle: 'Automaticky shromažďované údaje',
            items: [
              'IP adresa a informace o zařízení',
              'Data o používání aplikace',
              'Cookies a podobné technologie',
              'Lokalizační data (se souhlasem)'
            ]
          }
        ] as ListData[]
      }
    },
    {
      id: 'pouziti',
      title: 'Jak používáme vaše údaje',
      icon: <Lock className="h-5 w-5" />,
      content: {
        type: 'list',
        items: [
          'Poskytování a zlepšování našich služeb',
          'Vytváření a správa vašeho účtu',
          'Komunikace s vámi o službách',
          'Zabezpečení a prevence podvodů',
          'Analýza používání pro zlepšení služeb',
          'Plnění právních povinností'
        ]
      }
    },
    {
      id: 'sdileni',
      title: 'Sdílení údajů',
      icon: <Shield className="h-5 w-5" />,
      content: {
        type: 'text_with_list',
        text: 'Vaše osobní údaje nesdílíme s třetími stranami, kromě následujících případů:',
        items: [
          'Se souhlasem uživatele',
          'S poskytovateli služeb (hosting, analýzy)',
          'Za účelem dodržení právních povinností',
          'Pro ochranu práv a bezpečnosti'
        ]
      }
    },
    {
      id: 'prava',
      title: 'Vaše práva',
      icon: <User className="h-5 w-5" />,
      content: {
        type: 'text_with_list',
        text: 'Máte následující práva ohledně svých osobních údajů:',
        items: [
          'Právo na přístup: Můžete požádat o kopii svých údajů',
          'Právo na opravu: Můžete opravit nesprávné údaje',
          'Právo na výmaz: Můžete požádat o smazání svých údajů',
          'Právo na přenositelnost: Můžete požádat o přenos údajů',
          'Právo na omezení: Můžete omezit zpracování údajů',
          'Právo namítat: Můžete namítat proti zpracování'
        ]
      }
    }
  ];

  // Additional sections for cookies, security, retention, contact
  const additionalSections = [
    {
      id: 'cookies',
      title: 'Cookies a sledovací technologie',
      icon: <Eye className="h-5 w-5" />,
      content: {
        type: 'list',
        items: [
          'Zapamatování přihlášení a preferencí',
          'Analýzu návštěvnosti',
          'Zlepšení funkcionality aplikace',
          'Zabezpečení služeb'
        ]
      }
    },
    {
      id: 'zabezpeceni',
      title: 'Zabezpečení údajů',
      icon: <Lock className="h-5 w-5" />,
      content: 'Používáme odpovídající technická a organizační opatření k ochraně vašich osobních údajů před neoprávněným přístupem, ztrátou, zničením nebo pozměněním. Zahrnuje to šifrování, zabezpečené servery a pravidelné bezpečnostní audity.'
    },
    {
      id: 'uchovani',
      title: 'Doba uchovávání',
      icon: <Clock className="h-5 w-5" />,
      content: 'Vaše osobní údaje uchováváme pouze po dobu nezbytnou pro naplnění účelů zpracování nebo po dobu stanovenou právními předpisy. Po uplynutí této doby údaje bezpečně smažeme.'
    },
    {
      id: 'kontakt',
      title: 'Kontakt',
      icon: <Mail className="h-5 w-5" />,
      content: {
        type: 'contact',
        data: {
          name: 'Strakatá Turistika',
          email: 'privacy@strakataturistika.cz',
          address: '[Vaše adresa]'
        } as ContactData
      }
    }
  ];

  const allSections = [...sections, ...additionalSections];

  return (
    <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role} className="px-6">
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Last Updated Banner */}
        <div className="flex justify-center">
          <div className="bg-gray-100 border border-gray-200 text-gray-600 text-xs rounded-full px-4 py-1 mb-2">
            Poslední aktualizace: 1. ledna 2025
          </div>
        </div>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <IOSCircleIcon variant="blue" size="lg">
              <Shield className="h-8 w-8" />
            </IOSCircleIcon>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Zásady ochrany osobních údajů</h1>
          </div>
        </div>

        {/* Redesigned Table of Contents */}
        <nav aria-label="Obsah" className="mb-8 sticky top-24 z-10">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <ul className="flex gap-3 min-w-max">
              {allSections.map((section, idx) => {
                const v = sectionVariants[idx % sectionVariants.length];
                return (
                  <li key={section.id} className="min-w-[180px]">
                    <a
                      href={`#${section.id}`}
                      className="block transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none"
                    >
                      <div className={cn(
                        "flex flex-col items-center gap-2 bg-white/70 backdrop-blur-md rounded-2xl shadow border border-gray-100 px-4 py-3",
                        "bg-gradient-to-br",
                        v.tocHoverGradient
                      )}>
                        <IOSCircleIcon variant={v.circle} size="sm">
                          {section.icon}
                        </IOSCircleIcon>
                        <span className="text-xs font-semibold text-gray-700">
                          {idx + 1}. {section.title}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <IOSSection title="Ochrana vašich dat">
          <div className="space-y-6">
            {allSections.map((section, index) => {
              const v = sectionVariants[index % sectionVariants.length];
              // Remove/merge empty or placeholder cards
              if (
                (section.id === 'kontakt' && section.content && typeof section.content === 'object' && 'type' in section.content && section.content.type === 'contact' && 
                 (!section.content.data || !('email' in section.content.data) || !section.content.data.email || section.content.data.address === '[Vaše adresa]'))
              ) {
                return null;
              }
              return (
                <IOSCard
                  key={section.id}
                  title={`${index + 1}. ${section.title}`}
                  icon={section.icon}
                  iconBackground={v.iconBg}
                  iconColor={v.iconColor}
                  variant="outlined"
                  id={section.id}
                  className={cn("bg-gradient-to-br", v.cardGradient)}
                >
                  {/* Generic Contact Renderer */}
                  {typeof section.content === 'object' && section.content.type === 'contact' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <User className={`w-5 h-5 ${v.iconColor}`} />
                        <span className="font-medium text-gray-800">{(section.content.data as ContactData).name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className={`w-5 h-5 ${v.iconColor}`} />
                        <span>{(section.content.data as ContactData).email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className={`w-5 h-5 ${v.iconColor}`} />
                        <span>{(section.content.data as ContactData).address}</span>
                      </div>
                    </div>
                  )}

                  {/* Jaké údaje shromažďujeme: two-column grid */}
                  {section.id === 'udaje' && typeof section.content === 'object' && section.content.type === 'lists' && section.content.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {(section.content.data as ListData[]).map((subSection: ListData, idx: number) => (
                        <div key={idx}>
                          <h4 className="font-semibold text-gray-900 mb-3">{subSection.subtitle}</h4>
                          <div className="space-y-2">
                            {subSection.items.map((item: string, itemIdx: number) => (
                              <div key={itemIdx} className="flex items-start gap-2 text-gray-700">
                                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${v.iconBg}`}></div>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Vaše práva: two-column grid */}
                  {section.id === 'prava' && typeof section.content === 'object' && section.content.type === 'text_with_list' && section.content.items && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {section.content.items.map((item: string, idx: number) => {
                        const [right, ...desc] = item.split(':');
                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            <span className={`font-semibold ${v.iconColor}`}>{right.trim()}</span>
                            <span className="text-gray-700 text-sm">{desc.join(':').trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Default rendering for other sections */}
                  {typeof section.content === 'string' && (
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  )}
                  {typeof section.content === 'object' && section.content.type === 'list' && section.content.items && (
                    <div className="space-y-2">
                      {section.content.items.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-700">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${v.iconBg}`}></div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {typeof section.content === 'object' && section.content.type === 'text_with_list' && section.content.items && (
                    <div className="space-y-4">
                      {(section.content as SectionContent).text && (
                        <p className="text-gray-700">{(section.content as SectionContent).text}</p>
                      )}
                      <div className="space-y-2">
                        {section.content.items.map((item: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-gray-700">
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${v.iconBg}`}></div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </IOSCard>
              );
            })}
          </div>
        </IOSSection>
      </div>
    </CommonPageTemplate>
  );
} 