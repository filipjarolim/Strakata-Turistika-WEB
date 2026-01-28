import React from 'react';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { ExtendedUser } from '@/next-auth';

interface VisitData {
  visitedPlaces: string;
  dogNotAllowed: string;
  routeLink: string;
  routeTitle: string;
  routeDescription: string;
}

interface VisitDataFormProps {
  initialData: VisitData;
  onSubmit: (data: VisitData) => void;
  user: ExtendedUser | null;
}

export const VisitDataForm: React.FC<VisitDataFormProps> = ({
  initialData,
  onSubmit,
  user
}) => {
  const [formData, setFormData] = React.useState(initialData);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSubmit(newData);
  };

  return (
    <div className="space-y-4">
      <IOSTextInput
        id="visited-places"
        value={formData.visitedPlaces}
        onChange={(e) => handleChange('visitedPlaces', e.target.value)}
        label="Navštívená místa"
        placeholder="Zadejte navštívená místa"
      />

      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 transition-all hover:bg-white/50 dark:hover:bg-white/5 hover:border-indigo-500/50 backdrop-blur-xl">
        <span className="text-sm font-medium text-gray-900 dark:text-white">Psi nejsou povoleni</span>
        <IOSSwitch
          checked={formData.dogNotAllowed === "true"}
          onCheckedChange={(checked) => handleChange('dogNotAllowed', checked ? "true" : "false")}
        />
      </div>

      {user?.dogName && (
        <IOSTextInput
          id="dog-name"
          value={user.dogName}
          readOnly
          label="Jméno psa"
        />
      )}
    </div>
  );
}; 