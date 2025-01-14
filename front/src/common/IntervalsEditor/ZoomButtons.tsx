import React from 'react';
import { useTranslation } from 'react-i18next';
import { TbZoomCancel, TbZoomIn, TbZoomOut } from 'react-icons/tb';
import { getZoomedViewBox } from 'common/IntervalsDataViz/data';
import { IntervalItem } from './types';

type ZoomButtonProps = {
  data: IntervalItem[];
  setViewBox: (viewBox: [number, number] | null) => void;
  viewBox: [number, number] | null;
};

const ZoomButtons = ({ data, setViewBox, viewBox }: ZoomButtonProps) => {
  const { t } = useTranslation('common/common');

  return (
    <div>
      <div className="zoom-horizontal">
        <button
          title={t('actions.zoom-in')}
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setViewBox(getZoomedViewBox(data, viewBox, 'IN'))}
        >
          <TbZoomIn />
        </button>
        <button
          title={t('actions.reset')}
          type="button"
          disabled={viewBox === null}
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setViewBox(null)}
        >
          <TbZoomCancel />
        </button>
        <button
          title={t('actions.zoom-out')}
          type="button"
          disabled={viewBox === null}
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setViewBox(getZoomedViewBox(data, viewBox, 'OUT'))}
        >
          <TbZoomOut />
        </button>
      </div>
    </div>
  );
};

export default ZoomButtons;
