import { SNCFCOLORSONLY } from 'applications/osrd/consts';

const randomColor = () => {
  const colors = Object.values(SNCFCOLORSONLY);
  const len = colors.length;
  const idx = Math.floor(Math.random() * len);
  return colors[idx];
};

const convertStops = (steps) => {
  let beforeStepName;
  let beforeStepTime;
  const newStepList = [];
  steps.forEach((step) => {
    if (step.label !== beforeStepName) {
      newStepList.push({
        duration: 0,
        name: step.label,
        position: step.position,
        time: step.time,
        type: step.type,
      });
    } else {
      newStepList.splice(-1);
      newStepList.push({
        duration: step.time - beforeStepTime,
        name: step.label,
        position: step.position,
        time: step.time,
        type: step.type,
      });
    }
    beforeStepName = step.label;
    beforeStepTime = step.time;
  });
  return newStepList;
};

const convertData = (trains) => {
  const newData = trains.map((train, idx) => ({
    id: idx,
    name: train.name ? train.name : train.train_metadata.name,
    color: randomColor(),
    base: {
      head_positions: [
        train.space_time_curves.time_table
          ? train.space_time_curves.time_table.map((step) => ({
              time: step.time,
              position: step.position,
            }))
          : train.space_time_curves[1].points.map((step) => ({
              time: step.time,
              position: step.position,
            })),
      ],
      tail_positions: [
        train.space_time_curves.actual
          ? train.space_time_curves.actual.map((step) => ({
              time: step.time,
              position: step.position,
            }))
          : train.space_time_curves[0].points.map((step) => ({
              time: step.time,
              position: step.position,
            })),
      ],
      stops: convertStops(
        train.space_time_curves.time_table
          ? train.space_time_curves.time_table
          : train.space_time_curves[0].points
      ),
    },
  }));
  return newData;
};

export default convertData;