package fr.sncf.osrd.stdcm.graph;

import fr.sncf.osrd.utils.graph.Pathfinding;

public record STDCMNode(
        // Time at the transition of the edge
        double time,
        // Speed at the end of the previous edge
        double speed,
        // Detector that separates the blocks, this is the physical location of the node (DirDetectorId)
        int detector,
        // Sum of all the delays we have added by shifting the departure time
        double totalPrevAddedDelay,
        // Maximum delay we can add by delaying the start time without causing conflicts
        double maximumAddedDelay,
        // Edge that lead to this node
        STDCMEdge previousEdge,
        // Index of the last waypoint passed by the train
        int waypointIndex,
        // Position on a block, if this node isn't on the transition between blocks (stop)
        Pathfinding.EdgeLocation<Integer> locationOnBlock,
        // When the node is a stop, how long the train remains here
        double stopDuration
) {
}
