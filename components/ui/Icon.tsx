import React from 'react';
import * as Icons from 'lucide-react';

type IconProps = {
    name: keyof typeof Icons;
    className?: string;
};

const Icon: React.FC<IconProps> = ({ name, className }) => {
    const LucideIcon = Icons[name] as React.ElementType;
    return <LucideIcon className={className} />;
};

export default Icon;