import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActionStep } from '../../types/actionPlan';
import { ActionCard } from './ActionCard';

interface ActionStepListProps {
  steps: ActionStep[];
  onToggleStatus: (stepId: string, currentStatus: string) => void;
  onOpenChecklist: (step: ActionStep) => void;
}

export const ActionStepList: React.FC<ActionStepListProps> = ({
  steps,
  onToggleStatus,
  onOpenChecklist,
}) => {
  return (
    <View style={styles.container}>
      {steps.map((step) => (
        <ActionCard
          key={step.id}
          step={step}
          onToggleStatus={onToggleStatus}
          onOpenChecklist={onOpenChecklist}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
