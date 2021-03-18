package fr.sncf.osrd.train.lifestages;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import fr.sncf.osrd.infra.Infra;
import fr.sncf.osrd.infra.OperationalPoint;
import fr.sncf.osrd.infra.TVDSection;
import fr.sncf.osrd.infra.routegraph.Route;
import fr.sncf.osrd.infra.signaling.TrainInteractable;
import fr.sncf.osrd.infra.trackgraph.Detector;
import fr.sncf.osrd.infra.trackgraph.TrackSection;
import fr.sncf.osrd.infra.trackgraph.Waypoint;
import fr.sncf.osrd.simulation.Simulation;
import fr.sncf.osrd.simulation.SimulationError;
import fr.sncf.osrd.speedcontroller.LimitAnnounceSpeedController;
import fr.sncf.osrd.train.TrackSectionRange;
import fr.sncf.osrd.train.Train;
import fr.sncf.osrd.train.TrainState;
import fr.sncf.osrd.utils.PointValue;
import fr.sncf.osrd.utils.graph.BiGraphDijkstra;
import fr.sncf.osrd.utils.graph.DistCostFunction;
import fr.sncf.osrd.utils.graph.EdgeDirection;
import fr.sncf.osrd.utils.graph.path.BasicPathEnd;
import fr.sncf.osrd.utils.graph.path.BasicPathStart;
import fr.sncf.osrd.utils.graph.path.FullPathArray;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.function.Consumer;

public class SignalNavigateStage implements LifeStage {
    @SuppressFBWarnings({"URF_UNREAD_FIELD"})
    private final ArrayList<Route> routePath;
    private final ArrayList<TrackSectionRange> trackSectionPath;
    private final ArrayList<PointValue<TrainInteractable>> eventPath;

    private SignalNavigateStage(
            ArrayList<Route> routePath,
            ArrayList<TrackSectionRange> trackSectionPath,
            ArrayList<PointValue<TrainInteractable>> eventPath
    ) {
        this.routePath = routePath;
        this.trackSectionPath = trackSectionPath;
        this.eventPath = eventPath;
    }

    /** Creates and store the path some train will follow */
    @SuppressFBWarnings({"FE_FLOATING_POINT_EQUALITY", "BC_UNCONFIRMED_CAST"}) // TODO: remove me
    public static SignalNavigateStage from(
            Infra infra,
            OperationalPoint start,
            OperationalPoint end,
            double beginOffset,
            double driverSightDistance
    ) {
        // TODO Compute offset of the start/end of each route
        var startingPoints = new ArrayList<BasicPathStart<Route>>();
        for (var tracks : start.refs) {
            for (var route : tracks.routes)
                startingPoints.add(new BasicPathStart<>(0, route, EdgeDirection.START_TO_STOP, 0));
        }
        var goalEdges = new ArrayList<Route>();
        for (var tracks : end.refs) {
            goalEdges.addAll(tracks.routes);
        }

        var costFunction = new DistCostFunction<Route>();
        var foundPaths = new ArrayList<FullPathArray<Route, BasicPathStart<Route>, BasicPathEnd<Route>>>();

        BiGraphDijkstra.findPaths(
                infra.routeGraph,
                startingPoints,
                costFunction,
                (pathNode) -> {
                    for (var goalEdge : goalEdges) {
                        if (goalEdge == pathNode.edge) {
                            var addedCost = costFunction.evaluate(goalEdge, pathNode.position, goalEdge.length);
                            return new BasicPathEnd<>(addedCost, goalEdge, pathNode.direction, 0, pathNode);
                        }
                    }
                    return null;
                },
                (pathToGoal) -> {
                    foundPaths.add(FullPathArray.from(pathToGoal));
                    return false;
                });

        if (foundPaths.isEmpty())
            throw new RuntimeException("dijkstra found no path");

        var routePath = new ArrayList<Route>();
        // Convert path nodes to a list of routes
        // Ignore last node since it's a duplicated edge of the second last.
        var nodes = foundPaths.get(0).pathNodes;
        for (var i = 0; i < nodes.size() - 1; i++) {
            var node = nodes.get(i);
            routePath.add(node.edge);
        }

        var trackSectionPath = routesToTrackSectionPositions(routePath, beginOffset);
        var eventPath = trackSectionToEventPath(driverSightDistance, trackSectionPath);

        return new SignalNavigateStage(routePath, trackSectionPath, eventPath);
    }

    /** Build track section path. Need to concatenate all track section of all TvdSectionPath.
     * Avoid to have in the path TrackSectionPositions that reference the same TrackSection. */
    private static ArrayList<TrackSectionRange> routesToTrackSectionPositions(
            ArrayList<Route> routePath,
            double beginOffset
    ) {
        var flattenSections = new ArrayList<TrackSectionRange>();
        for (var route : routePath) {
            for (var tvdSectionPath : route.tvdSectionsPath) {
                for (var trackSection : tvdSectionPath.trackSections) {
                    if (beginOffset <= 0) {
                        flattenSections.add(trackSection);
                        continue;
                    }

                    if (beginOffset < trackSection.length())
                        flattenSections.add(new TrackSectionRange(trackSection.edge, trackSection.direction,
                                trackSection.beginOffset + beginOffset, trackSection.endOffset));
                    beginOffset -= trackSection.length();
                }
            }
        }

        var trackSectionPath = new ArrayList<TrackSectionRange>();

        TrackSectionRange lastTrack = flattenSections.get(0);
        for (var i = 1; i < flattenSections.size(); i++) {
            var currentTrack = flattenSections.get(i);
            if (lastTrack.edge != currentTrack.edge) {
                trackSectionPath.add(lastTrack);
                lastTrack = currentTrack;
                continue;
            }
            // Merge the last track section range with the current one
            lastTrack = new TrackSectionRange(
                    lastTrack.edge,
                    lastTrack.direction,
                    lastTrack.beginOffset,
                    currentTrack.endOffset);
        }
        trackSectionPath.add(lastTrack);
        return trackSectionPath;
    }

    private static ArrayList<PointValue<TrainInteractable>> trackSectionToEventPath(
            double driverSightDistance,
            Iterable<TrackSectionRange> trackSectionRanges
    ) {
        var eventPath = new ArrayList<PointValue<TrainInteractable>>();
        double pathLength = 0;
        for (var trackRange : trackSectionRanges) {
            for (var interactablePoint : TrackSection.getInteractables(trackRange.edge, trackRange.direction)) {
                var objEdgePosition = trackRange.getEdgeRelPosition(interactablePoint.position);
                if (objEdgePosition < trackRange.beginOffset || objEdgePosition > trackRange.endOffset)
                    continue;

                var interactable = interactablePoint.value;

                var sightDistance = Double.min(interactable.getInteractionDistance(), driverSightDistance);
                var edgeDistToObj = objEdgePosition - trackRange.beginOffset;
                var objPathOffset = pathLength + edgeDistToObj - sightDistance;
                if (objPathOffset < 0)
                    objPathOffset = 0;

                eventPath.add(new PointValue<>(objPathOffset, interactable));
            }
            pathLength += trackRange.edge.length;
        }
        eventPath.sort(Comparator.comparing(pointValue -> pointValue.position));
        return eventPath;
    }

    public enum InteractionType {
        TAIL,
        HEAD
    }

    @Override
    public LifeStageState getState() {
        return new State(this);
    }

    @Override
    public void forEachPathSection(Consumer<TrackSectionRange> consumer) {
        trackSectionPath.forEach(consumer);
    }

    @SuppressFBWarnings({"URF_UNREAD_FIELD"})
    public static class State extends LifeStageState {
        public final SignalNavigateStage stage;
        private int routeIndex = 0;
        private int eventPathIndex = 0;

        public State(SignalNavigateStage stage) {
            this.stage = stage;
        }

        private InteractionType nextInteractionType(TrainState trainState) {
            var nextHeadPosition = stage.eventPath.get(eventPathIndex).position;

            double nextTailPosition = Double.POSITIVE_INFINITY;
            if (!trainState.interactablesUnderTrain.isEmpty())
                nextTailPosition = trainState.interactablesUnderTrain.getFirst().position;

            if (nextTailPosition + trainState.trainSchedule.rollingStock.length < nextHeadPosition)
                return InteractionType.TAIL;
            return InteractionType.HEAD;
        }

        private PointValue<TrainInteractable> nextInteraction(TrainState trainState, InteractionType interactionType) {
            switch (interactionType) {
                case HEAD:
                    var nextHeadEvent = stage.eventPath.get(eventPathIndex);

                    if (nextHeadEvent.value.getInteractionType().interactsWithTail())
                        trainState.interactablesUnderTrain.addLast(nextHeadEvent);

                    eventPathIndex++;
                    return nextHeadEvent;
                case TAIL:
                    return trainState.interactablesUnderTrain.removeFirst();
                default:
                    throw new RuntimeException("Unknown interaction type");
            }
        }

        @Override
        public void simulate(Simulation sim, Train train, TrainState trainState) throws SimulationError {
            // Check if we reached our goal
            if (eventPathIndex == stage.eventPath.size()) {
                sim.scheduleEvent(
                        train,
                        sim.getTime(),
                        new Train.TrainStateChange(sim, train.getID(), trainState.nextStage())
                );
                return;
            }

            // 1) find the next event position
            var interactionType = nextInteractionType(trainState);
            var nextEventTrackPosition = nextInteraction(trainState, interactionType);

            // 2) simulate up to nextEventTrackPosition
            var newTrainState = trainState.clone();
            var simulationResult = newTrainState.evolveState(sim, nextEventTrackPosition.position);

            // 3) create an event with simulation data up to this point
            var eventTime = simulationResult.newState.time;
            assert eventTime >= sim.getTime();
            var event = new Train.TrainReachesInteraction(
                    nextEventTrackPosition.value, simulationResult, interactionType);
            sim.scheduleEvent(train, eventTime, event);
        }

        /**
         * A function called by signals when a new limit is announced
         * @param distanceToAnnounce distance to the place the announce starts
         * @param distanceToExecution distance to the place the limit must be enforced
         */
        public void onLimitAnnounce(
                TrainState trainState,
                double distanceToAnnounce,
                double distanceToExecution,
                double speedLimit
        ) {
            var currentPos = trainState.location.getPathPosition();
            trainState.speedControllers.add(new LimitAnnounceSpeedController(
                    speedLimit,
                    currentPos + distanceToAnnounce,
                    currentPos + distanceToExecution,
                    trainState.trainSchedule.rollingStock.timetableGamma
            ));
        }

        private TVDSection findForwardTVDSection(Waypoint waypoint) {
            for (; routeIndex < stage.routePath.size(); routeIndex++) {
                var route = stage.routePath.get(routeIndex);
                for (var i = 0; i < route.tvdSectionsPath.size(); i++) {
                    var tvdSectionPath = route.tvdSectionsPath.get(i);
                    var tvdSectionPathDirection = route.tvdSectionsPathDirection.get(i);
                    if (tvdSectionPath.getEndNode(tvdSectionPathDirection) == waypoint.index)
                        return waypoint.getTvdSectionPathNeighbors(tvdSectionPathDirection).get(0).tvdSection;
                }
            }
            throw new RuntimeException("Can't find the waypoin in the planned route path");
        }

        private TVDSection findBackwardTVDSection(Waypoint waypoint) {
            for (; routeIndex < stage.routePath.size(); routeIndex++) {
                var route = stage.routePath.get(routeIndex);
                for (var i = 0; i < route.tvdSectionsPath.size(); i++) {
                    var tvdSectionPath = route.tvdSectionsPath.get(i);
                    var tvdSectionPathDirection = route.tvdSectionsPathDirection.get(i);
                    if (tvdSectionPath.getEndNode(tvdSectionPathDirection) == waypoint.index)
                        return tvdSectionPath.tvdSection;
                }
            }
            throw new RuntimeException("Can't find the waypoin in the planned route path");
        }

        /** Occupy and free tvd sections given a detector the train is interacting with. */
        public void updateTVDSections(Simulation sim, Detector detector, InteractionType interactionType) {
            // Occupy the next tvdSection
            if (interactionType == InteractionType.HEAD) {
                var forwardTVDSectionPath = findForwardTVDSection(detector);
                var nextTVDSection = sim.infraState.getTvdSectionState(forwardTVDSectionPath.index);
                nextTVDSection.occupy(sim);
                return;
            }
            // Free the last tvdSection
            var backwardTVDSectionPath = findBackwardTVDSection(detector);
            var nextTVDSection = sim.infraState.getTvdSectionState(backwardTVDSectionPath.index);
            nextTVDSection.occupy(sim);
        }
    }
}
