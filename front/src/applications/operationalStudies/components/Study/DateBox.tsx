import React from 'react';
import { useTranslation } from 'react-i18next';
import { dateTimeFrenchFormatting } from 'utils/date';

type Props = {
  date?: Date | null;
  className: string;
  translation: string;
};

export default function DateBox({ date, className, translation }: Props) {
  const { t } = useTranslation('operationalStudies/study');
  return (
    <div className={`study-details-dates-date ${className}`}>
      <span className="study-details-dates-date-label">{t(`dates.${translation}`)}</span>
      <span className="study-details-dates-date-value">
        {date ? (
          dateTimeFrenchFormatting(date)
        ) : (
          <small className="text-muted">{t('noDateFound')}</small>
        )}
      </span>
    </div>
  );
}
