import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, Users } from 'lucide-react';

type ToggleViewButtonProps = {
    isCumulativeView: boolean;
    toggleView: () => void;
};

export const ToggleViewButton: React.FC<ToggleViewButtonProps> = ({
                                                                      isCumulativeView,
                                                                      toggleView,
                                                                  }) => (
    <Button
        variant="ghost"
        onClick={toggleView}
        className="flex items-center gap-2"
    >
        {isCumulativeView ? <Users className="w-4 h-4" /> : <Table className="w-4 h-4" />}
        {isCumulativeView ? 'Osobní pohled' : 'Pohled na záznamy'}
    </Button>
);