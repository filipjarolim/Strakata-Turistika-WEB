# Dynamický formulář - implementace na webu

## 📋 Přehled

Dynamický formulář umožňuje správu web i mobilní aplikace přes administrační rozhraní bez úprav kódu. Pomocí databáze se načítají formulářová pole a ukládají se jako `extraData` v záznamu `VisitData`.

---

## 🗄️ Databázová struktura

### FormField model (Prisma Schema)

```prisma
model FormField {
  id          String   @id @default(cuid()) @map("_id")
  name        String   @unique           // Interní název pole (např. "dog_name")
  label       String                     // Zobrazený název (např. "Jméno psa")
  type        String                     // Typ pole: "text", "textarea", "number", "select", "checkbox", "date"
  placeholder String?                    // Nápověda pro uživatele
  required    Boolean  @default(false)   // Je pole povinné?
  options     Json?                      // Pro select pole: [{ value, label }]
  order       Int      @default(0)       // Pořadí zobrazení
  active      Boolean  @default(true)    // Je pole aktivní?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### VisitData model - nový field

```prisma
model VisitData {
  // ... existující fields
  extraData   Json?  // Dynamic form data: { fieldName: value }
  // ... další fields
}
```

---

## 🛠️ API Endpointy

### GET /api/form-fields

**Popis:** Načte dynamická formulářová pole z databáze

**Autentizace:** Veřejný endpoint

**Chování:**
- **Admin:** Vidí všechna pole (včetně neaktivních)
- **Uživatelé:** Vidí pouze aktivní pole (`active: true`)

**Response:**
```json
[
  {
    "id": "cm123xyz",
    "name": "dog_name",
    "label": "Jméno psa",
    "type": "text",
    "required": true,
    "placeholder": "Zadejte jméno psa",
    "options": null,
    "order": 0,
    "active": true
  },
  {
    "id": "cm124abc",
    "name": "weather",
    "label": "Počasí",
    "type": "select",
    "required": false,
    "placeholder": null,
    "options": [
      { "value": "sunny", "label": "Slunečno" },
      { "value": "rainy", "label": "Déšť" }
    ],
    "order": 1,
    "active": true
  }
]
```

### POST /api/form-fields

**Popis:** Vytvoří nové formulářové pole (pouze ADMIN)

**Request Body:**
```json
{
  "name": "dog_name",
  "label": "Jméno psa",
  "type": "text",
  "required": true,
  "placeholder": "Zadejte jméno psa",
  "options": null
}
```

---

## 🎨 Frontend komponenty

### DynamicFormFields.tsx

**Lokalita:** `components/soutez/DynamicFormFields.tsx`

**Props:**
```typescript
interface DynamicFormFieldsProps {
  values?: Record<string, any>;     // Aktuální hodnoty formuláře
  onChange: (values: Record<string, any>) => void;  // Callback při změně
  dark?: boolean;                   // Tmavý/světlý režim
}
```

**Fungování:**

1. **Načítání konfigurace**
   ```typescript
   useEffect(() => {
     const loadFields = async () => {
       const response = await fetch('/api/form-fields');
       const data = await response.json();
       setFields(data); // Filtruje pouze active: true pro uživatele
     };
     loadFields();
   }, []);
   ```

2. **Renderování pole podle typu**
   - `text` → `<IOSTextInput>`
   - `textarea` → `<IOSTextarea>`
   - `number` → `<IOSTextInput type="number">`
   - `select` → HTML `<select>` s options
   - `checkbox` → HTML checkbox
   - `date` → `<IOSTextInput type="date">`

3. **Synchronizace hodnot**
   - Vnitřní state `formValues` ukládá aktuální hodnoty
   - Při změně se zavolá callback `onChange` s novými hodnotami
   - Podporuje synchronizaci s externími values přes `useEffect`

---

## 📝 Integrace do workflow

### UploadStep.tsx

**Přidání:**

```typescript
// State pro extraData
const [extraData, setExtraData] = useState<Record<string, any>>({});

// V JSX - po routeDescription
<DynamicFormFields
  values={extraData}
  onChange={setExtraData}
  dark={true}
/>

// Při ukládání do API
const response = await fetch('/api/visitData', {
  method: 'POST',
  body: JSON.stringify({
    // ... other fields
    extraData: extraData  // Přidáno
  })
});
```

**Pozice:** V kartě "Základní informace" po polích `routeName` a `routeDescription`

---

## 💾 Ukládání dat

### Flow dat

```
┌─────────────────────────────────────┐
│ 1. ADMIN vytvoří FormField v DB     │
│    (přes admin panel)                │
└─────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 2. Uživatel načte formulář           │
│    GET /api/form-fields              │
│    → vrátí aktivní pole              │
└─────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 3. DynamicFormFields vyrendruje pole │
│    podle konfigurace                 │
└─────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 4. Uživatel vyplní hodnoty           │
│    → extraData = {                   │
│         dog_name: "Rex",             │
│         weather: "sunny"             │
│       }                               │
└─────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 5. Ukládání do VisitData             │
│    POST /api/visitData               │
│    → extraData uloženo jako JSON     │
└─────────────────────────────────────┘
```

### Příklad uložených dat

**VisitData record:**
```json
{
  "id": "cm123abc",
  "routeTitle": "Trasa v Jeseníkách",
  "extraData": {
    "dog_name": "Rex",
    "weather": "sunny",
    "notes": "Pěkný výhled na vrcholu"
  },
  // ... další fields
}
```

---

## 🔗 Propojení s mobilní aplikací

### Sdílená struktura

**Oba platformy (Web i Mobile) používají:**

1. **Stejnou databázovou kolekci** `FormFields`
2. **Stejné typy polí:**
   - `text`, `textarea`, `number`, `email`
   - `select` (s options)
   - `checkbox`, `date`

3. **Stejné ukládání:** `extraData` v `VisitData`

### Příklad konzistentnosti

**Mobilní app (Flutter):**
```dart
// Načtení polí
final fields = await formFieldService.getFormFields();

// Renderování
switch (field.type) {
  case 'text':
    return TextField(...);
  case 'select':
    return DropdownButton(...);
}
```

**Web (Next.js):**
```typescript
// Načtení polí
const fields = await fetch('/api/form-fields');

// Renderování
switch (field.type) {
  case 'text':
    return <IOSTextInput />;
  case 'select':
    return <select>...</select>;
}
```

**Výsledek:** Admin vytvoří pole jednou a zobrazí se na obou platformách.

---

## 🎯 Podporované typy polí

### 1. Text (`text`)
- Jednořádkový textový vstup
- **Props:** `label`, `placeholder`, `required`
- **Příklad:** Jméno psa

### 2. Email (`email`)
- Validace emailové adresy
- Stejné jako text, ale HTML5 validace

### 3. Textarea (`textarea`)
- Víceřádkový textový vstup
- **Props:** `label`, `placeholder`, `required`

### 4. Number (`number`)
- Číselný vstup
- Automaticky parsuje na `parseFloat()`

### 5. Select (`select`)
- Dropdown s možnostmi
- **Props:** `options` - array `[{ value, label }]`
- **Příklad:**
  ```json
  "options": [
    { "value": "sunny", "label": "Slunečno" },
    { "value": "cloudy", "label": "Oblačno" }
  ]
  ```

### 6. Checkbox (`checkbox`)
- Boolean switch
- Ukládá se jako `true`/`false`

### 7. Date (`date`)
- HTML5 date picker
- Formát: `YYYY-MM-DD`

---

## 🚀 Použití

### Přidání do nového kroku

```typescript
// 1. Import
import DynamicFormFields from "@/components/soutez/DynamicFormFields";

// 2. State
const [extraData, setExtraData] = useState<Record<string, any>>({});

// 3. Renderování
<DynamicFormFields
  values={extraData}
  onChange={setExtraData}
  dark={true}
/>

// 4. Uložení
await fetch('/api/visitData', {
  method: 'POST',
  body: JSON.stringify({
    // ... other data
    extraData: extraData
  })
});
```

---

## 📊 Výhody

✅ **Modulární** – Jeden komponent pro všechna pole  
✅ **Konzistentní** – Stejná data na webu i v mobile app  
✅ **Flexibilní** – Admin může měnit pole bez deploy  
✅ **Typově bezpečné** – TypeScript interface  
✅ **Responzivní** – Funguje na PC i mobile  
✅ **Dark mode** – Podpora tmavého režimu  
✅ **Validace** – Podpora required fields  

---

## 🔧 Správa formuláře

### Vytvoření nového pole (Admin)

1. **Manuálně v databázi** nebo **přes API:**
   ```bash
   POST /api/form-fields
   {
     "name": "dogs_count",
     "label": "Počet psů",
     "type": "number",
     "required": false,
     "placeholder": "Zadejte počet"
   }
   ```

2. Pole se automaticky objeví ve všech formulářích

### Deaktivace pole

- Nastav `active: false` v databázi
- Uživatelé ho již neuvidí
- Admin ho stále vidí v admin panelu

---

## 🎨 Customizace

### Dark/Light mode

```typescript
<DynamicFormFields
  dark={true}  // Tmavý režim pro soutez page
/>

<DynamicFormFields
  dark={false} // Světlý režim pro jiné stránky
/>
```

### Vlastní styling

Komponenta používá:
- **iOS-styled** komponenty (`IOSTextInput`, `IOSTextarea`)
- **Tailwind CSS** pro styling
- **Consistent design** s celou aplikací

---

## 📝 Checklist implementace

- ✅ Databázové schema (`FormField` model)
- ✅ API endpoint (`GET /api/form-fields`)
- ✅ Frontend komponenta (`DynamicFormFields.tsx`)
- ✅ Integrace do `UploadStep`
- ✅ Ukládání `extraData` do `VisitData`
- ✅ Filtering pro active/inactive fields
- ✅ Propojení s mobile app
- ⏳ Integrace do `EditStep` (v přípravě)
- ⏳ Zobrazení `extraData` v admin panelu (v přípravě)

---

## 🔍 Debugging

### Zkontrolovat načtená pole

```javascript
// V console
fetch('/api/form-fields')
  .then(r => r.json())
  .then(console.log)
```

### Zkontrolovat uložená extraData

```javascript
// V VisitData record
visitData.extraData
```

### Common issues

1. **Pole se nezobrazují:**
   - Zkontroluj, že `active: true` v databázi
   - Zkontroluj API response

2. **Hodnoty se neukládají:**
   - Zkontroluj, že `extraData` je v POST requestu
   - Zkontroluj console errors

---

## 📚 Související soubory

```
components/soutez/
  └── DynamicFormFields.tsx       # Main komponenta

app/api/
  ├── form-fields/
  │   └── route.ts                # GET/POST endpoints
  └── visitData/
      └── route.ts                # Updated s extraData

app/soutez/steps/
  └── UploadStep.tsx              # Integrace

prisma/
  └── schema.prisma               # FormField model + extraData field
```

---

**Autor:** Implementováno pro Strakatá Turistika  
**Datum:** 2025  
**Platformy:** Web (Next.js) + Mobile (Flutter) - sdílená konfigurace
