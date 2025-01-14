import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ConsolidatedRouteAspect } from 'reducers/osrdsimulation/types';
import { RootState } from 'reducers';

/**
 *
 * @param routeAspects
 * @param time
 * @returns current Canton occupied by current train, [start, end] in meters
 * @TODO do not work with colors as string as soon as possible
 */
const getOccupancyBounds = (routeAspects: ConsolidatedRouteAspect[], time: Date) => {
  const relevantAspect = routeAspects.find((routeAspect) => {
    const relevantTime = time || new Date();
    const relevantStartTime = routeAspect.time_start || new Date();
    const relevantEndTime = routeAspect.time_end || new Date();
    return (
      relevantStartTime < relevantTime &&
      relevantEndTime >= relevantTime &&
      routeAspect.color === 'rgba(255, 0, 0, 255)'
    );
  });
  return relevantAspect ? [relevantAspect.position_start, relevantAspect.position_end] : [0, 0];
};

export default function TrainDetails() {
  const { positionValues, timePosition, consolidatedSimulation, selectedTrainId } = useSelector(
    (state: RootState) => state.osrdsimulation
  );

  const { t } = useTranslation(['simulation']);

  const occupancyBounds = useMemo(() => {
    const foundTrain = consolidatedSimulation.find((train) => train.id === selectedTrainId);

    return (
      foundTrain &&
      getOccupancyBounds(foundTrain.routeAspects, new Date(positionValues?.headPosition?.time))
    );
  }, [consolidatedSimulation, positionValues, selectedTrainId]);

  return (
    <div className="d-flex">
      {positionValues.headPosition && timePosition && (
        <>
          <div className="rounded px-1 train-detail small bg-blue text-white text-nowrap mr-2">
            <div className="font-weight-bold text-uppercase">{t('trainDetails.headPosition')}</div>
            {positionValues.headPosition && Math.round(positionValues.headPosition.position) / 1000}
            km
          </div>
          <div className="rounded px-1 train-detail small bg-cyan text-white text-nowrap mr-2">
            <div className="font-weight-bold text-uppercase">{t('trainDetails.tailPosition')}</div>
            {positionValues.tailPosition && Math.round(positionValues.tailPosition.position) / 1000}
            km
          </div>
          {occupancyBounds && (
            <>
              <div className="rounded px-1 train-detail small bg-success text-black text-nowrap mr-2">
                <div className="font-weight-bold text-uppercase">
                  {t('trainDetails.routeBeginOccupancy')}
                </div>
                {Math.round(occupancyBounds[0]) / 1000}
                km
              </div>
              <div className="rounded px-1 train-detail small bg-yellow text-black text-nowrap mr-2">
                <div className="font-weight-bold text-uppercase">
                  {t('trainDetails.routeEndOccupancy')}
                </div>
                {Math.round(occupancyBounds[1]) / 1000}
                km
              </div>
              <div className="rounded px-1 train-detail small bg-secondary text-white text-nowrap mr-2">
                <div className="font-weight-bold text-uppercase">
                  {t('trainDetails.routeSizeOccupancy')}
                </div>
                {Math.round(occupancyBounds[1] - occupancyBounds[0]) / 1000}
                km
              </div>
            </>
          )}
          <div className="rounded px-1 train-detail small bg-pink text-white">
            <div className="font-weight-bold text-uppercase">{t('trainDetails.speed')}</div>
            {positionValues.speed && Math.round(positionValues.speed.speed)}
            km/h
          </div>
        </>
      )}
    </div>
  );
}
