import React from 'react';

interface Props {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
  children: React.ReactNode;
  onSkip?: () => void;
}

/** Nafahat is currently fully free, so this compatibility wrapper never gates content. */
export const PremiumGate: React.FC<Props> = ({ children }) => <>{children}</>;
