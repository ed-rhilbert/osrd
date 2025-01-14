import React from 'react';
import { MiniCardsStudyProps } from './ScenarioExplorerTypes';

export default function StudyMiniCard({ study, setSelectedID, isSelected }: MiniCardsStudyProps) {
  return (
    <div
      className={`scenario-explorator-modal-part-itemslist-minicard study ${
        isSelected ? 'selected' : ''
      } ${study.scenarios_count && study.scenarios_count > 0 ? '' : 'empty'}`}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedID(study.id)}
    >
      <div>{study.name}</div>
    </div>
  );
}
