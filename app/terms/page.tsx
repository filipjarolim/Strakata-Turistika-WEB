import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { currentUser, currentRole } from '@/lib/auth';
import { Shield, User, FileText, Gavel, Copyright, ShieldAlert, FileClock, Ban, Mail } from 'lucide-react';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSCircleIcon } from '@/components/ui/ios/circle-icon';
import { IOSSection } from '@/components/ui/ios/section';
import { cn } from '@/lib/utils';

interface SectionContent {
  text: string;
}

interface TermsSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  id: string;
}

export default async function TermsPage() {
  const user = await currentUser();
  const role = await currentRole();

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
    { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', circle: 'default', cardGradient: 'from-gray-50/40 to-white', tocHoverGradient: 'hover:from-gray-50 hover:to-white' },
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', circle: 'blue', cardGradient: 'from-blue-50/40 to-white', tocHoverGradient: 'hover:from-blue-50 hover:to-white' },
    { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', circle: 'amber', cardGradient: 'from-amber-50/40 to-white', tocHoverGradient: 'hover:from-amber-50 hover:to-white' },
  ];

  const sections: TermsSection[] = [
    { id: 'uvod', title: 'Úvod', icon: <FileText className="h-5 w-5" />, content: 'Vítejte v aplikaci Strakatá Turistika. Tyto podmínky upravují vaše používání naší aplikace a služeb. Přístupem nebo používáním naší služby souhlasíte s těmito podmínkami.' },
    { id: 'ucet', title: 'Uživatelský účet', icon: <User className="h-5 w-5" />, content: 'Pro plné využívání služeb si musíte vytvořit účet. Jste zodpovědní za udržování důvěrnosti vašeho účtu a hesla. Souhlasíte s tím, že nás neprodleně informujete o jakémkoli neoprávněném použití vašeho účtu.' },
    { id: 'pravidla', title: 'Pravidla chování', icon: <Gavel className="h-5 w-5" />, content: 'Zavazujete se nepoužívat službu k žádným nezákonným účelům nebo k porušování práv ostatních. Je zakázáno nahrávat obsah, který je urážlivý, obtěžující nebo jinak nevhodný.' },
    { id: 'vlastnictvi', title: 'Duševní vlastnictví', icon: <Copyright className="h-5 w-5" />, content: 'Služba a její původní obsah, funkce a funkcionality jsou a zůstanou výhradním vlastnictvím Strakatá Turistika a jejích poskytovatelů licencí. Obsah nahraný vámi zůstává vaším vlastnictvím, ale udělujete nám licenci k jeho použití v rámci služby.' },
    { id: 'odpovednost', title: 'Omezení odpovědnosti', icon: <ShieldAlert className="h-5 w-5" />, content: 'V žádném případě nenese Strakatá Turistika odpovědnost za žádné nepřímé, náhodné, zvláštní, následné nebo represivní škody vzniklé z vašeho přístupu k službě nebo jejího používání.' },
    { id: 'zmeny', title: 'Změny podmínek', icon: <FileClock className="h-5 w-5" />, content: 'Vyhrazujeme si právo kdykoli upravit tyto podmínky. Pokud je změna podstatná, poskytneme vám alespoň 30denní oznámení před nabytím účinnosti nových podmínek. Pokračováním v používání služby po nabytí účinnosti těchto změn souhlasíte s upravenými podmínkami.' },
    { id: 'ukonceni', title: 'Ukončení', icon: <Ban className="h-5 w-5" />, content: 'Váš přístup ke službě můžeme okamžitě ukončit nebo pozastavit bez předchozího upozornění nebo odpovědnosti z jakéhokoli důvodu, včetně porušení těchto podmínek.' },
    { id: 'kontakt', title: 'Kontakt', icon: <Mail className="h-5 w-5" />, content: 'Pokud máte jakékoli dotazy týkající se těchto podmínek, kontaktujte nás na adrese legal@strakataturistika.cz.' }
  ];

  return (
    <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role} className="px-6">
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <IOSCircleIcon variant="blue" size="lg">
              <Shield className="h-8 w-8" />
            </IOSCircleIcon>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Podmínky použití</h1>
          </div>
        </div>

        {/* Table of Contents */}
        <nav aria-label="Obsah" className="mb-8 sticky top-24 z-10">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <ul className="flex gap-3 min-w-max">
              {sections.map((section, idx) => {
                const v = sectionVariants[idx % sectionVariants.length];
                return (
                  <li key={section.id} className="min-w-[180px]">
                    <a href={`#${section.id}`} className="block transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none">
                      <div className={cn("flex flex-col items-center gap-2 bg-white/70 backdrop-blur-md rounded-2xl shadow border border-gray-100 px-4 py-3", "bg-gradient-to-br", v.tocHoverGradient)}>
                        <IOSCircleIcon variant={v.circle} size="sm">{section.icon}</IOSCircleIcon>
                        <span className="text-xs font-semibold text-gray-700">{idx + 1}. {section.title}</span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <IOSSection title="Právní ujednání">
          <div className="space-y-6">
            {sections.map((section, index) => {
              const v = sectionVariants[index % sectionVariants.length];
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
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </IOSCard>
              );
            })}
          </div>
        </IOSSection>
      </div>
    </CommonPageTemplate>
  );
} 