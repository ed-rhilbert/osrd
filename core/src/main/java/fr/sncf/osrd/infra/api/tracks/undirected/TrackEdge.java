package fr.sncf.osrd.infra.api.tracks.undirected;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableRangeMap;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.RangeMap;
import fr.sncf.osrd.geom.LineString;
import fr.sncf.osrd.infra.api.Direction;
import fr.sncf.osrd.sim_infra.api.LoadingGaugeConstraint;
import java.util.EnumMap;

/**
 * An undirected track edge, which can either be a branch of a switch, or a track section
 */
public sealed interface TrackEdge permits SwitchBranch, TrackSection {
    /** The physical length of the edge, in meters */
    double getLength();

    /** List of detectors on the track */
    ImmutableList<Detector> getDetectors();

    /** List of gradients on the track for a given direction (corrected with curves) */
    EnumMap<Direction, RangeMap<Double, Double>> getGradients();

    /** The interval tree of the slopes of the track section */
    EnumMap<Direction, RangeMap<Double, Double>> getSlopes();

    /** The interval tree of the curves of the track section */
    EnumMap<Direction, RangeMap<Double, Double>> getCurves();

    /** List of speed sections on the track for a given direction */
    EnumMap<Direction, RangeMap<Double, SpeedLimits>> getSpeedSections();

    /** Global unique index starting at 0, used for union finds */
    int getIndex();

    /** Returns the geographical geometry */
    LineString getGeo();

    /** Returns the schematic geometry */
    LineString getSch();

    /** Returns the operational points on the edge */
    ImmutableSet<OperationalPoint> getOperationalPoints();

    /** Returns the ID if the edge is a track section, otherwise the signal ID with ports */
    String getID();

    /** Returns a list of ranges, each having a set of blocked loading gauge type */
    ImmutableRangeMap<Double, LoadingGaugeConstraint> getLoadingGaugeConstraints();

    /** Returns a voltage usable at any position */
    RangeMap<Double, String> getVoltages();

    /** Returns the ranges covered by neutral sections */
    RangeMap<Double, NeutralSection> getNeutralSections(Direction direction);

    /** Returns the ranges covered by neutral section announcements */
    RangeMap<Double, NeutralSection> getNeutralSectionAnnouncements(Direction direction);
}
