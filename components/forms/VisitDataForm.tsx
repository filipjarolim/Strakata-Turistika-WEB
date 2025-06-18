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

      <IOSSwitch
        checked={formData.dogNotAllowed === "true"}
        onCheckedChange={(checked) => handleChange('dogNotAllowed', checked ? "true" : "false")}
        label="Psi nejsou povoleni"
      />

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