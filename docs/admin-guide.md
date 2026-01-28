# Admin Příručka - Strakatá Turistika

Tato příručka je určena pro administrátory systému pro efektivní správu soutěže a kontrolu dat.

## Denní Agenda

### 1. Kontrola návštěv (VisitData)
Hlavní úkol admina je schvalování nově nahraných tras v sekci `/admin/VisitData`.
- **Stav PENDING_REVIEW**: Zde se nachází trasy čekající na vaši akci.
- **Co kontrolovat**:
    - **Fotky**: Odpovídají deklarovanému datu? Nejsou to stažené obrázky z internetu?
    - **GPS trasa**: Působí věrohodně? Není to záznam z auta/kola (příliš vysoká rychlost)?
    - **Místa**: Skutečně uživatel navštívil vrchol? (Vzdálenost by měla být do 50-100m).
- **Rozhodnutí**:
    - **Schválit**: Body se okamžitě započítají do žebříčku.
    - **Zamítnout**: Vždy uveďte důvod (např. "Chybí foto z vrcholu", "Trasa ujeta autem").

### 2. Speciální validace (Trail Validation)
U kategorií jako Vrcholy (PEAK), Jeskyně (CAVE) nebo Zříceniny (RUINS) vyžadujeme:
- Typ důkazu (např. Cedule KČT, Mohyla, Rozcestník).
- Kontrolu, zda trasa vede po turistické značce (pokud je to vyžadováno).

## Pokročilé Nástroje

### Hromadné operace (`/admin/bulk-operations`)
- **Hromadné schválení**: Schválí všechny nevyřízené návštěvy aktuální sezóny. Používejte s maximální opatrností, ideálně na konci měsíce po zběžné kontrole.
- **Přepočet bodování**: Pokud změníte bodové hodnoty v nastavení (`/admin/scoring`), musíte spustit tento přepočet, aby se historie aktualizovala.

### Správa témat měsíce (`/admin/themes`)
Na začátku každého měsíce vytvořte nové téma:
- Název (např. "Kouzelný Podzim").
- Klíčová slova (např. "listí, vyhlídka, hrad").
- Systém automaticky přidělí +5 bodů každému, kdo tato slova má v názvu trasy nebo popisu míst.

### Výjimky (`/admin/exceptions`)
Zde vyřizujte žádosti o zkrácení minimální vzdálenosti (z 3 km na 1.5 km).
- Schvalujte pouze na základě relevantních důvodů (zdravotní stav, věk).

## Bezpečnost a Integrita
- **Similarity Check**: Systém automaticky upozorňuje, pokud uživatel nahraje identickou trasu, kterou už jednou šel.
- **Soft Delete**: Pokud smažete návštěvu, nezmizí z DB úplně, ale nastaví se jí pole `deletedAt`. To umožňuje obnovu v případě chyby.

V případě technických problémů kontaktujte vývojáře.
