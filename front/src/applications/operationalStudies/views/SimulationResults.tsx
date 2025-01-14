import cx from 'classnames';
import React, { useEffect, useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { updateViewport, Viewport } from 'reducers/map';
import {
  persistentRedoSimulation,
  persistentUndoSimulation,
} from 'reducers/osrdsimulation/simulation';
import { getTimetableID } from 'reducers/osrdconf/selectors';
import {
  getDisplaySimulation,
  getIsUpdating,
  getOsrdSimulation,
  getPresentSimulation,
  getSelectedProjection,
  getSelectedTrain,
} from 'reducers/osrdsimulation/selectors';
import { updateSelectedProjection, updateSimulation } from 'reducers/osrdsimulation/actions';

import SimulationWarpedMap from 'common/Map/WarpedMap/SimulationWarpedMap';
import { osrdEditoastApi, SimulationReport } from 'common/api/osrdEditoastApi';

import getSimulationResults from 'applications/operationalStudies/components/Scenario/getSimulationResults';
import SimulationResultsMap from 'modules/simulationResult/components/SimulationResultsMap';
import SpaceCurvesSlopes from 'modules/simulationResult/components/SpaceCurvesSlopes';
import SpaceTimeChartIsolated from 'modules/simulationResult/components/SpaceTimeChart/withOSRDData';
import SpeedSpaceChart from 'modules/simulationResult/components/SpeedSpaceChart/SpeedSpaceChart';
import TimeButtons from 'modules/simulationResult/components/TimeButtons';
import TimeLine from 'modules/simulationResult/components/TimeLine/TimeLine';
import TrainDetails from 'modules/simulationResult/components/TrainDetails';
import DriverTrainSchedule from 'modules/trainschedule/components/DriverTrainSchedule/DriverTrainSchedule';

const MAP_MIN_HEIGHT = 450;

type SimulationResultsProps = {
  isDisplayed: boolean;
  collapsedTimetable: boolean;
};

export default function SimulationResults({
  isDisplayed,
  collapsedTimetable,
}: SimulationResultsProps) {
  const { t } = useTranslation('operationalStudies/scenario');
  const dispatch = useDispatch();

  const { chart } = useSelector(getOsrdSimulation);
  const displaySimulation = useSelector(getDisplaySimulation);
  const selectedTrain = useSelector(getSelectedTrain);
  const { positionValues, timePosition } = useSelector(getOsrdSimulation);
  const timetableID = useSelector(getTimetableID);
  const selectedProjection = useSelector(getSelectedProjection);
  const simulation = useSelector(getPresentSimulation);
  const isUpdating = useSelector(getIsUpdating);

  const timeTableRef = useRef<HTMLDivElement | null>(null);
  const [extViewport, setExtViewport] = useState<Viewport | undefined>(undefined);
  const [showWarpedMap, setShowWarpedMap] = useState(false);

  const [heightOfSpaceTimeChart, setHeightOfSpaceTimeChart] = useState(600);
  const [heightOfSpeedSpaceChart, setHeightOfSpeedSpaceChart] = useState(250);
  const [heightOfSimulationMap] = useState(MAP_MIN_HEIGHT);
  const [heightOfSpaceCurvesSlopesChart, setHeightOfSpaceCurvesSlopesChart] = useState(150);
  const [initialHeightOfSpaceCurvesSlopesChart, setInitialHeightOfSpaceCurvesSlopesChart] =
    useState(heightOfSpaceCurvesSlopesChart);

  const [getTimetable] = osrdEditoastApi.endpoints.getTimetableById.useLazyQuery();

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'z' && e.metaKey) {
      dispatch(persistentUndoSimulation());
    }
    if (e.key === 'e' && e.metaKey) {
      dispatch(persistentRedoSimulation());
    }
  };

  useEffect(() => {
    // Setup the listener to undi /redo
    window.addEventListener('keydown', handleKey);
    return function cleanup() {
      window.removeEventListener('keydown', handleKey);
      dispatch(updateSelectedProjection(undefined));
      dispatch(updateSimulation({ trains: [] }));
    };
  }, []);

  useEffect(() => {
    if (timetableID && selectedProjection) {
      getTimetable({ id: timetableID })
        .unwrap()
        .then((result) => {
          getSimulationResults(result);
        });
    }
    return function cleanup() {
      dispatch(updateSimulation({ trains: [] }));
    };
  }, [selectedProjection, timetableID]);

  useEffect(() => {
    if (extViewport !== undefined) {
      dispatch(
        updateViewport({
          ...extViewport,
        })
      );
    }
  }, [extViewport]);

  return simulation.trains.length === 0 && !isUpdating ? (
    <h1 className="text-center mt-5">{t('simulation:noData')}</h1>
  ) : (
    <div className="simulation-results">
      {/* SIMULATION : STICKY BAR */}
      <div
        className={cx(
          'osrd-simulation-sticky-bar',
          collapsedTimetable && 'with-collapsed-timetable'
        )}
      >
        <div className="row">
          <div className="col-xl-4">
            {selectedTrain && (
              <TimeButtons
                selectedTrain={selectedTrain as SimulationReport}
                timePosition={timePosition}
              />
            )}
          </div>
          <div className="col-xl-8 d-flex justify-content-end mt-2 mt-xl-0">
            <TrainDetails />
          </div>
        </div>
      </div>

      {/* SIMULATION : TIMELINE */}
      {simulation.trains.length && chart && (
        <TimeLine
          chart={chart}
          selectedTrainId={selectedTrain?.id || simulation.trains[0].id}
          trains={simulation.trains as SimulationReport[]}
          timePosition={timePosition}
        />
      )}

      {/* SIMULATION : SPACE TIME CHART */}
      <div className="simulation-warped-map d-flex flex-row align-items-stretch mb-2 bg-white">
        <button
          type="button"
          className="show-warped-map-button my-3 ml-3 mr-1"
          onClick={() => setShowWarpedMap(!showWarpedMap)}
        >
          <i className={showWarpedMap ? 'icons-arrow-prev' : 'icons-arrow-next'} />
        </button>
        <SimulationWarpedMap collapsed={!showWarpedMap} />

        <div className="osrd-simulation-container d-flex flex-grow-1 flex-shrink-1">
          <div
            className="spacetimechart-container"
            style={{ height: `${heightOfSpaceTimeChart}px` }}
          >
            {displaySimulation && (
              <SpaceTimeChartIsolated
                initialHeightOfSpaceTimeChart={heightOfSpaceTimeChart}
                onSetBaseHeightOfSpaceTimeChart={setHeightOfSpaceTimeChart}
                isDisplayed={isDisplayed}
              />
            )}
          </div>
        </div>
      </div>

      {/* TRAIN : SPACE SPEED CHART */}
      {selectedTrain && (
        <div className="osrd-simulation-container d-flex mb-2">
          <div
            className="speedspacechart-container"
            style={{ height: `${heightOfSpeedSpaceChart}px` }}
          >
            <SpeedSpaceChart
              initialHeight={heightOfSpeedSpaceChart}
              onSetChartBaseHeight={setHeightOfSpeedSpaceChart}
              positionValues={positionValues}
              selectedTrain={selectedTrain}
              timePosition={timePosition}
            />
          </div>
        </div>
      )}

      {/* TRAIN : CURVES & SLOPES */}
      <div className="osrd-simulation-container d-flex mb-2">
        <div
          className="spacecurvesslopes-container"
          style={{ height: `${heightOfSpaceCurvesSlopesChart}px` }}
        >
          {selectedTrain && (
            <Rnd
              default={{
                x: 0,
                y: 0,
                width: '100%',
                height: `${heightOfSpaceCurvesSlopesChart}px`,
              }}
              disableDragging
              enableResizing={{
                bottom: true,
              }}
              onResizeStart={() =>
                setInitialHeightOfSpaceCurvesSlopesChart(heightOfSpaceCurvesSlopesChart)
              }
              onResize={(_e, _dir, _refToElement, delta) => {
                setHeightOfSpaceCurvesSlopesChart(
                  initialHeightOfSpaceCurvesSlopesChart + delta.height
                );
              }}
            >
              <SpaceCurvesSlopes
                initialHeight={heightOfSpaceCurvesSlopesChart}
                selectedTrain={selectedTrain}
                timePosition={timePosition}
                positionValues={positionValues}
              />
            </Rnd>
          )}
        </div>
      </div>

      {/* TRAIN : DRIVER TRAIN SCHEDULE */}
      {selectedTrain && (
        <div className="osrd-simulation-container mb-2">
          <DriverTrainSchedule train={selectedTrain} />
        </div>
      )}

      {/* SIMULATION : MAP */}
      <div ref={timeTableRef}>
        <div className="osrd-simulation-container mb-2">
          <div className="osrd-simulation-map" style={{ height: `${heightOfSimulationMap}px` }}>
            <SimulationResultsMap setExtViewport={setExtViewport} />
          </div>
        </div>
      </div>
    </div>
  );
}
