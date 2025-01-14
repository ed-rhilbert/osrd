package fr.sncf.osrd.stdcm.graph;

import fr.sncf.osrd.envelope.Envelope;
import fr.sncf.osrd.sim_infra.api.InterlockingInfraKt;
import fr.sncf.osrd.sim_infra.impl.BlockInfraImplKt;
import fr.sncf.osrd.utils.graph.Pathfinding;
import fr.sncf.osrd.utils.units.Distance;
import java.util.Objects;

public record STDCMEdge(
        // Block considered for this edge
        int block,
        // Envelope of the train going through the block (starts at t=0). Does not account for allowances.
        Envelope envelope,
        // Time at which the train enters the block
        double timeStart,
        // Maximum delay we can add after this block by delaying the start time without causing conflicts
        double maximumAddedDelayAfter,
        // Delay we needed to add in this block to avoid conflicts (by shifting the departure time)
        double addedDelay,
        // Time of the next occupancy of the block, used to identify the "opening" used by the edge
        double timeNextOccupancy,
        // Total delay we have added by shifting the departure time since the start of the path
        double totalDepartureTimeShift,
        // Node located at the start of this edge, null if this is the first edge
        STDCMNode previousNode,
        // Offset of the envelope if it doesn't start at the beginning of the edge
        long envelopeStartOffset,
        // Time at which the train enters the block, discretized by only considering the minutes.
        // Used to identify visited edges
        int minuteTimeStart,
        // Speed factor used to account for standard allowance.
        // e.g. if we have a 5% standard allowance, this value is 1/1.05
        double standardAllowanceSpeedFactor,
        // Index of the last waypoint passed by this train
        int waypointIndex,
        // True if the edge end is a stop
        boolean endAtStop
) {
    @Override
    public boolean equals(Object other) {
        if (other == null || other.getClass() != STDCMEdge.class)
            return false;
        var otherEdge = (STDCMEdge) other;
        if (block != otherEdge.block)
            return false;

        // We need to consider that the edges aren't equal if the times are different,
        // but if we do it "naively" we end up visiting the same places a near-infinite number of times.
        // We handle it by discretizing the start time of the edge: we round the time down to the minute and compare
        // this value.
        return minuteTimeStart == otherEdge.minuteTimeStart;
    }

    @Override
    public int hashCode() {
        return Objects.hash(block, timeNextOccupancy);
    }

    /** Returns the node at the end of this edge */
    STDCMNode getEdgeEnd(STDCMGraph graph) {
        if (!endAtStop) {
            // We move on to the next block
            return new STDCMNode(
                    getTotalTime() + timeStart(),
                    envelope().getEndSpeed(),
                    BlockInfraImplKt.getBlockExit(graph.blockInfra, graph.rawInfra, block),
                    totalDepartureTimeShift(),
                    maximumAddedDelayAfter(),
                    this,
                    waypointIndex,
                    null,
                    -1
            );
        } else {
            // New edge on the same block, after a stop
            double stopDuration = graph.steps.get(waypointIndex + 1).duration();
            var newWaypointIndex = waypointIndex + 1;
            while (newWaypointIndex + 1 < graph.steps.size() && !graph.steps.get(newWaypointIndex + 1).stop())
                newWaypointIndex++; // Skip waypoints where we don't stop (not handled here)
            return new STDCMNode(
                    getTotalTime() + timeStart() + stopDuration,
                    envelope.getEndSpeed(),
                    -1,
                    totalDepartureTimeShift(),
                    maximumAddedDelayAfter(),
                    this,
                    newWaypointIndex,
                    new Pathfinding.EdgeLocation<>(block, envelopeStartOffset + getLength()),
                    stopDuration
            );
        }
    }

    /** Returns how long it takes to go from the start to the end of the block, accounting standard allowance. */
    public double getTotalTime() {
        return envelope.getTotalTime() / standardAllowanceSpeedFactor;
    }

    /** Returns the length of the edge */
    public long getLength() {
        return Distance.fromMeters(envelope.getEndPos());
    }
}
