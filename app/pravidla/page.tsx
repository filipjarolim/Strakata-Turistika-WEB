import React from 'react'
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

//Bodování
// Pravidla soutěže
// POZOR ZMĚNA OPROTI MINULÉMU ROČNÍKU - LETOS JE POVOLENA POUZE CHŮZE, ŽÁDNÝ DOPRAVNÍ PROSTŘEDEK (KOLO, LOĎ, BĚŽKY)
//  V letošním roce budou základem soutěže zdolané kilometry + navštívená místa.
// Několik základních pravidel:
// 1)  trasa musí měřit nejméně 3 km (POZOR !! nevztahuje se na téma měsíce ) na trase musíte navštívit alespoˇn 1 bodované místo. Takže nejmenší počet bodů, které můžete získat je 4 - 3 za kilometry + 1 za bodované místo
//
// počet  tras ušlých za jeden den není nijak omezen
//
// Pro psí (i lidské) seniory, psy (i lidi) v rekonvalescenci, psy (i lidi) s handicapem apod. je v odůvodněných případech možné udělit výjimku - viz záložka VÝJIMKA !!!
//
//
// 2) body se dávají i za desetiny kilometru - trasa 6,8 km znamená 6,8 bodů.
//
// 3) jako důkaz ušlých (povolená je jen CHŮZE, žádný dopravní prostředek, jen své nohy)  km budete posílat screen nebo odkaz z aplikace,  z mobilu - stopař, strava apod. nebo z chytrých hodinek. Dále budete posílat fotky z bodovaných míst tak, jak jste byli zvyklí doposud. Pokud by byl někdo, kdo nemá chytrý telefon ani chytré hodinky, tak pošle podobrobně popsaný itinerář a jako důkaz fotky z trasy např. rozcestí, turistický přístřešek, parkoviště apod.
//
// PROTOŽE SE LETOS BODUJÍ I UŠLÉ KILOMETRY, TAK POKUD NA TRASE NARAZÍTE NA MÍSTO, KTERÉ SE NEBODUJE, ALE JE HEZKÉ (např. zřícenina hradu, potůček, výhled do kraje atd.)  A VÁŠ PES HEZKY ZAPÓZUJE A BUDETE TAK MÍT POVEDENOU FOTKU, TAK JI URČITĚ POŠLETE S TEXTEM "FOTO Z TRASY" - AŤ MÁME Z ČEHO VYBÍRAT DO KALENDÁŘE :-)
//
// 4) pokud půjdete trasu, na které se nachází více bodovaných míst, tak je možné si body "pošetřit" - tzn. že neseberete všechny body hned napoprvé, ale pokud půjdete víckrát, tak nikdy nesmí být trasa úplně stejná - musí tam být změna - delší, zkrácená, přidaná cesta apod.
//
// 5) v případě, že se zúčastníte dogtrekingu, canicrossu či jiného závodu a po cestě navštívíte bodová místa, tak je možné body do ST použít, ale už nebudete moct bodovat s tím samým závodem  v pracovním strakáči
//
// Může se stát, že bodované místo bude nedostupné a tudíž se nemůže uznat. Není v našich silách zkontrolovat přístupnost všech bodů, je tedy potřeba si předem doma projít mapu a zkontrolovat místa, abyste se nevydali na výšlap a až na místě zjistili, že se objekt nachází např. klidové zóně NP a není tam vstup povolen.
//
//  Ve Strakaté turistice panuje zdravá rivalita, a proto upřesnění pravidel při rovnosti bodů :
//
// Při rovnosti bodů za celé bodovací období rozhoduje:
//
//  1) počet ušlých kilometrů
//
//  2) počet bodů za navštívená místa
//
//
//
// Organizátoři si vyhrazují právo na úpravu pravidel v průběhu soutěže. Neděláme to rádi, ale někdy v průběhu roku nastane neočekávaná situace a my na ni musíme zareagovat.
//
// Soutěž je pro členy Spolku českého strakatého psa.
//
// Bodovací období je pro letošní ročník od 1. 11. 2024 do 31. 10. 2025.
//
// Pro zasílání fotek používejte nejlépe formulář zde na stránce a fotka nesmí být starší 14 dní,
//
// MAX. 14 OD POŘÍZENÍ jinak nemusí být uznána!
//
// Konec ročníku 2025 je 31. 10. 2025 ! - tzn. že poslední termín pro zaslání fotky je nejdéle
//
// do 31. 10. 2025  24:00 hod.!
//
//
//
// Za každé navštívené místo, které je v seznamu,  získáte příslušné body.
//
//
//
// Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou - kromě sekce Strakáč zve - tam jsou vlastní upravená pravidla
//
//
//
// V letošním ročníku jsou místa, kde můžete získat najednou více bodů ,  v tom případě musíte při posílání bodů napsat všechny získané body - není v našich silách tohle za vás kontrolovat.
//
// Na kopci, na naučené stezce či na jiném bodovaném místě pořídíte fotku, kterou pošlete přes tento kontaktní formulář  nebo e-mailem: info@strakataturistika.cz
//
// Soutěžící účastí v soutěži souhlasí se zveřejněním fotek se svým jménem na veřejné sociální síti Rajce.net
//
//
// Jméno a příjmení
// Nahrát souborSoubor nevybrán
// Vybrat soubor
// E-mail
// @
// Zpráva
// Odeslat
//
//
// K fotce je potřeba doplnit: Jméno majitele + psa (oficiální i volací), datum, název místa - (pokud je to místo "vícebodové" viz příklad bodování výše, tak prosím napište všechny možnosti )
// A určitě bude fajn, když se fotkami pochlubíte na FB - Český strakatý pes.....
//
// O průběžném pořadí budeme pravidelně informovat.
//
// A ještě prosba: hodně nám pomůže, když fotku, kterou nahráváte pojmenujete podle místa, kde byla pořízená. Někteří z vás to tak dělají a pro uložení a zapsání bodů je to velká pomoc. Díky :-)

const Page = () => {
    return (
        <CommonPageTemplate contents={{complete: true}}>
            <div className={"font-bold text-6xl"}>
                Pravidla
            </div>
        </CommonPageTemplate>

    )
}
export default Page
