import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { currentUser, currentRole } from '@/lib/auth';
import { Heart, Users, MapPin, Camera, Trophy, Compass, Target, Award, Shield, Mail } from 'lucide-react';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSCircleIcon } from '@/components/ui/ios/circle-icon';
import { IOSSection } from '@/components/ui/ios/section';
import { IOSButton } from '@/components/ui/ios/button';

export default async function AboutPage() {
  const user = await currentUser();
  const role = await currentRole();

  return (
    <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role} className="px-6">
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <IOSCircleIcon variant="blue" size="lg">
              <Heart className="h-8 w-8" />
            </IOSCircleIcon>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">O nás</h1>
            <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
              Spojujeme lásku k českým strakatým psům s krásou české přírody
            </p>
          </div>
        </div>

        {/* Mission */}
        <IOSCard
          title="Naše mise"
          subtitle="Proč jsme zde a co nás pohání"
          icon={<Target className="h-6 w-6" />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        >
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Strakatá Turistika vznikla z lásky k českým strakatým psům a k přírodě.
              Naším cílem je propojit komunitu majitelů těchto úžasných psů a pomoci jim
              objevovat nejkrásnější místa České republiky společně se svými čtyřnohými parťáky.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Věříme, že nejlepší dobrodružství se prožívají s věrným společníkem po boku.
              Proto jsme vytvořili platformu, která umožňuje sdílet trasy, fotografie a zážitky
              z výletů po celé republice.
            </p>
          </div>
        </IOSCard>

        {/* Values Grid */}
        <IOSSection title="Naše hodnoty">
          <div className="grid md:grid-cols-3 gap-6">
            <IOSCard
              title="Láska k psům"
              icon={<Heart className="h-5 w-5" />}
              iconBackground="bg-red-100"
              iconColor="text-red-600"
              variant="outlined"
              className="text-center"
            >
              <p className="text-gray-600">
                Český strakatý pes je naše vášeň. Chceme podporovat tuto úžasnou rasu
                a pomáhat majitelům najít to nejlepší pro své psy.
              </p>
            </IOSCard>

            <IOSCard
              title="Objevování přírody"
              icon={<MapPin className="h-5 w-5" />}
              iconBackground="bg-green-100"
              iconColor="text-green-600"
              variant="outlined"
              className="text-center"
            >
              <p className="text-gray-600">
                Česká republika je plná krásných míst čekajících na objevení.
                Pomáháme najít ta nejlepší místa pro výlety se psy.
              </p>
            </IOSCard>

            <IOSCard
              title="Komunita"
              icon={<Users className="h-5 w-5" />}
              iconBackground="bg-purple-100"
              iconColor="text-purple-600"
              variant="outlined"
              className="text-center"
            >
              <p className="text-gray-600">
                Spojujeme majitele strakatých psů z celé republiky a vytváříme
                silnou komunitu založenou na vzájemné podpoře.
              </p>
            </IOSCard>
          </div>
        </IOSSection>

        {/* Features */}
        <IOSSection title="Co nabízíme">
          <div className="grid md:grid-cols-2 gap-6">
            <IOSCard
              title="Plánování tras"
              icon={<Compass className="h-5 w-5" />}
              iconBackground="bg-blue-100"
              iconColor="text-blue-600"
              variant="outlined"
            >
              <p className="text-gray-600">
                Vytvářejte a sdílejte trasy vhodné pro psy. Najděte inspiraci
                pro svůj další výlet nebo se nechte vést zkušenějšími turisty.
              </p>
            </IOSCard>

            <IOSCard
              title="Sdílení zážitků"
              icon={<Camera className="h-5 w-5" />}
              iconBackground="bg-green-100"
              iconColor="text-green-600"
              variant="outlined"
            >
              <p className="text-gray-600">
                Zachyťte nejkrásnější momenty z vašich výletů a sdílejte je
                s ostatními milovníky strakatých psů.
              </p>
            </IOSCard>

            <IOSCard
              title="Bodový systém"
              icon={<Trophy className="h-5 w-5" />}
              iconBackground="bg-amber-100"
              iconColor="text-amber-600"
              variant="outlined"
            >
              <p className="text-gray-600">
                Získávejte body za navštívená místa a soutěžte s ostatními
                o umístění v žebříčcích nejaktivnějších turistů.
              </p>
            </IOSCard>

            <IOSCard
              title="Mapa míst"
              icon={<MapPin className="h-5 w-5" />}
              iconBackground="bg-purple-100"
              iconColor="text-purple-600"
              variant="outlined"
            >
              <p className="text-gray-600">
                Procházejte interaktivní mapu míst vhodných pro výlety se psy
                a objevujte nová dobrodružství ve vašem okolí.
              </p>
            </IOSCard>
          </div>
        </IOSSection>

        {/* Values */}
        <IOSCard
          title="Naše hodnoty"
          subtitle="Principy, kterými se řídíme"
          icon={<Award className="h-6 w-6" />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <IOSCircleIcon variant="blue" size="sm">
                <Shield className="h-4 w-4" />
              </IOSCircleIcon>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Odpovědnost k přírodě</h4>
                <p className="text-gray-600 text-sm">
                  Podporujeme odpovědnou turistiku. Vždy respektujeme přírodu,
                  chráněná území a práva ostatních návštěvníků.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <IOSCircleIcon variant="blue" size="sm">
                <Heart className="h-4 w-4" />
              </IOSCircleIcon>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Bezpečnost psů</h4>
                <p className="text-gray-600 text-sm">
                  Bezpečnost našich čtyřnohých parťáků je prioritou. Upozorňujeme
                  na rizika a poskytujeme informace pro bezpečné výlety.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <IOSCircleIcon variant="blue" size="sm">
                <Users className="h-4 w-4" />
              </IOSCircleIcon>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Podpora komunity</h4>
                <p className="text-gray-600 text-sm">
                  Věříme v sílu komunity. Podporujeme vzájemnou pomoc,
                  sdílení zkušeností a přátelské prostředí pro všechny.
                </p>
              </div>
            </div>
          </div>
        </IOSCard>

        {/* Contact */}
        <IOSCard
          title="Kontakt"
          subtitle="Spojte se s námi"
          icon={<Mail className="h-6 w-6" />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Máte otázky, návrhy nebo se chcete zapojit do rozvoje projektu?
              Rádi se s vámi spojíme!
            </p>
            <div className="bg-blue-50/50 backdrop-blur-xl p-4 rounded-2xl border border-blue-200/50">
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> info@strakataturistika.cz</p>
                <p><strong>Telefon:</strong> +420 XXX XXX XXX</p>
                <p><strong>Sociální sítě:</strong> Facebook, Instagram</p>
              </div>
            </div>
          </div>
        </IOSCard>

        {/* CTA */}
        <div className="text-center">
          <IOSCard
            title="Připojte se k nám"
            subtitle="Staňte se součástí rostoucí komunity milovníků strakatých psů"
            icon={<Heart className="h-6 w-6" />}
            iconBackground="bg-red-100"
            iconColor="text-red-600"
            className="text-center"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Objevujte krásy České republiky společně s námi a svými čtyřnohými parťáky.
              </p>
              <IOSButton className="bg-blue-600 hover:bg-blue-700 text-white">
                <Heart className="w-4 h-4 mr-2" />
                <a href="/auth/register">Registrovat se</a>
              </IOSButton>
            </div>
          </IOSCard>
        </div>
      </div>
    </CommonPageTemplate>
  );
} 