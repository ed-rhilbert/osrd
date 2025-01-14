import drawTrain from 'modules/simulationResult/components/SpaceTimeChart/drawTrain';
import createChart from 'modules/simulationResult/components/SpaceTimeChart/createChart';
import {
  AllowancesSettings,
  Chart,
  OsrdSimulationState,
  SimulationTrain,
  Train,
} from 'reducers/osrdsimulation/types';
import {
  DispatchUpdateChart,
  DispatchUpdateDepartureArrivalTimes,
  DispatchUpdateMustRedraw,
  DispatchUpdateSelectedTrainId,
} from './types';
import { KEY_VALUES_FOR_SPACE_TIME_CHART } from '../simulationResultsConsts';

function drawOPs(chartLocal: Chart, selectedTrainSimulation: Train, rotate: boolean) {
  const operationalPointsZone = chartLocal.drawZone
    .append('g')
    .attr('id', 'get-operationalPointsZone');
  selectedTrainSimulation.base.stops.forEach((stop) => {
    operationalPointsZone
      .append('line')
      .datum(stop.position)
      .attr('id', `op-${stop.id}`)
      .attr('class', 'op-line')
      .attr('x1', rotate ? (d) => chartLocal.x(d) : 0)
      .attr('y1', rotate ? 0 : (d) => chartLocal.y(d))
      .attr('x2', rotate ? (d) => chartLocal.x(d) : chartLocal.width)
      .attr('y2', rotate ? chartLocal.height : (d) => chartLocal.y(d));
    operationalPointsZone
      .append('text')
      .datum(stop.position)
      .attr('class', 'op-text')
      .text(`${stop.name || 'Unknown'} ${Math.round(stop.position) / 1000}`)
      .attr('x', rotate ? (d) => chartLocal.x(d) : 0)
      .attr('y', rotate ? 0 : (d) => chartLocal.y(d))
      .attr('text-anchor', 'center')
      .attr('dx', 5)
      .attr('dy', rotate ? 15 : -5);
  });
}

const drawAxisTitle = (chart: Chart, rotate: boolean) => {
  chart.drawZone
    .append('text')
    .attr('class', 'axis-unit')
    .attr('text-anchor', 'end')
    .attr('transform', rotate ? 'rotate(0)' : 'rotate(-90)')
    .attr('x', rotate ? chart.width - 10 : -10)
    .attr('y', rotate ? chart.height - 10 : 20)
    .text('KM');
};

const drawAllTrains = (
  allowancesSettings: AllowancesSettings,
  chart: Chart | undefined,
  CHART_ID: string,
  dispatchUpdateChart: DispatchUpdateChart,
  dispatchUpdateDepartureArrivalTimes: DispatchUpdateDepartureArrivalTimes,
  dispatchUpdateMustRedraw: DispatchUpdateMustRedraw,
  dispatchUpdateSelectedTrainId: DispatchUpdateSelectedTrainId,
  heightOfSpaceTimeChart: number,
  keyValues: typeof KEY_VALUES_FOR_SPACE_TIME_CHART,
  ref: React.MutableRefObject<HTMLDivElement> | React.RefObject<HTMLDivElement>,
  reset: boolean,
  rotate: boolean,
  selectedProjection: OsrdSimulationState['selectedProjection'],
  selectedTrain: Train,
  setChart: React.Dispatch<React.SetStateAction<Chart | undefined>>,
  setDragOffset: React.Dispatch<React.SetStateAction<number>>,
  simulationTrains: Train[],
  trainsToDraw: SimulationTrain[]
) => {
  const chartLocal = createChart(
    chart,
    CHART_ID,
    trainsToDraw,
    heightOfSpaceTimeChart,
    keyValues,
    ref,
    reset,
    rotate
  );

  if (selectedTrain) {
    drawOPs(chartLocal, selectedTrain, rotate);
  }

  drawAxisTitle(chartLocal, rotate);
  trainsToDraw.forEach((train) => {
    drawTrain(
      allowancesSettings,
      chartLocal,
      dispatchUpdateDepartureArrivalTimes,
      dispatchUpdateMustRedraw,
      dispatchUpdateSelectedTrainId,
      train.id === selectedProjection?.id,
      train.id === selectedTrain?.id,
      keyValues,
      rotate,
      setDragOffset,
      simulationTrains,
      train
    );
  });
  setChart(chartLocal);
  dispatchUpdateChart({ ...chartLocal, rotate });
  dispatchUpdateMustRedraw(false);
};

export { drawOPs, drawAllTrains };
