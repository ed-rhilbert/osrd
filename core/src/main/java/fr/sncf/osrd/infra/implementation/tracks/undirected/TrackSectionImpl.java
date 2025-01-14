package fr.sncf.osrd.infra.implementation.tracks.undirected;

import static java.lang.Math.abs;

import com.google.common.base.MoreObjects;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableRangeMap;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.TreeRangeMap;
import fr.sncf.osrd.geom.LineString;
import fr.sncf.osrd.infra.api.Direction;
import fr.sncf.osrd.infra.api.tracks.undirected.*;
import fr.sncf.osrd.sim_infra.api.LoadingGaugeConstraint;
import fr.sncf.osrd.utils.jacoco.ExcludeFromGeneratedCodeCoverage;
import java.util.EnumMap;
import java.util.HashMap;

public class TrackSectionImpl implements TrackSection {

    private final double length;
    private final String id;
    private final ImmutableSet<OperationalPoint> operationalPoints;
    EnumMap<Direction, RangeMap<Double, SpeedLimits>> speedSections;
    RangeMap<Double, String> catenaryVoltages = TreeRangeMap.create();

    EnumMap<Direction, RangeMap<Double, NeutralSection>> neutralSections;
    EnumMap<Direction, RangeMap<Double, NeutralSection>> neutralSectionAnnouncements;
    EnumMap<Direction, RangeMap<Double, Double>> curves;
    EnumMap<Direction, RangeMap<Double, Double>> slopes;
    ImmutableList<Detector> detectors = ImmutableList.of();
    int index;
    private final LineString geo;
    private final LineString sch;
    private final ImmutableRangeMap<Double, LoadingGaugeConstraint> loadingGaugeConstraints;

    @Override
    @ExcludeFromGeneratedCodeCoverage
    public String toString() {
        return MoreObjects.toStringHelper(this)
                .add("length", length)
                .add("id", id)
                .toString();
    }

    /** Constructor */
    public TrackSectionImpl(
            double length,
            String id,
            ImmutableSet<OperationalPoint> operationalPoints,
            LineString geo,
            LineString sch,
            ImmutableRangeMap<Double, LoadingGaugeConstraint> loadingGaugeConstraints
    ) {
        this.length = length;
        this.id = id;
        this.operationalPoints = operationalPoints;
        this.geo = geo;
        this.sch = sch;
        this.loadingGaugeConstraints = loadingGaugeConstraints;
        this.catenaryVoltages.put(Range.closed(0., length), "");
        neutralSections = new EnumMap<>(Direction.class);
        neutralSectionAnnouncements = new EnumMap<>(Direction.class);
        for (var dir : Direction.values()) {
            neutralSections.put(dir, TreeRangeMap.create());
            neutralSectionAnnouncements.put(dir, TreeRangeMap.create());
        }
    }

    /** Constructor with empty operational points, geometry, line code and track number */
    public TrackSectionImpl(
            double length,
            String id
    ) {
        this(length, id, ImmutableSet.of(), null, null, ImmutableRangeMap.of());
        speedSections = new EnumMap<>(Direction.class);
        curves = new EnumMap<>(Direction.class);
        slopes = new EnumMap<>(Direction.class);
        for (var dir : Direction.values()) {
            speedSections.put(dir, ImmutableRangeMap.of());
            curves.put(dir, ImmutableRangeMap.of());
            slopes.put(dir, ImmutableRangeMap.of());
        }
    }

    @Override
    public double getLength() {
        return length;
    }

    @Override
    public ImmutableList<Detector> getDetectors() {
        return detectors;
    }

    @Override
    public EnumMap<Direction, RangeMap<Double, Double>> getGradients() {
        // gradient = slope + 800 / |radius|
        EnumMap<Direction, RangeMap<Double, Double>> gradients = new EnumMap<>(Direction.class);
        for (var dir : Direction.values()) {
            // copy all slopes
            RangeMap<Double, Double> gmap = TreeRangeMap.create();
            gmap.putAll(getSlopes().get(dir));

            for (var curveEntry : getCurves().get(dir).asMapOfRanges().entrySet()) {
                var curve = curveEntry.getValue();
                if (curve == 0.)
                    continue;
                // for all slopes that overlap with a curve, adjust the gradient value
                var subMap = gmap.subRangeMap(curveEntry.getKey());
                var entries = new HashMap<>(subMap.asMapOfRanges());
                for (var entry : entries.entrySet())
                    gmap.putCoalescing(entry.getKey(), entry.getValue() + 800. / abs(curve));
            }

            gradients.put(dir, gmap);
        }
        return gradients;
    }

    @Override
    public EnumMap<Direction, RangeMap<Double, Double>> getSlopes() {
        return slopes;
    }

    @Override
    public EnumMap<Direction, RangeMap<Double, Double>> getCurves() {
        return curves;
    }

    @Override
    public EnumMap<Direction, RangeMap<Double, SpeedLimits>> getSpeedSections() {
        return speedSections;
    }

    @Override
    public int getIndex() {
        return index;
    }

    @Override
    public ImmutableSet<OperationalPoint> getOperationalPoints() {
        return operationalPoints;
    }

    @Override
    public String getID() {
        return id;
    }

    @Override
    public ImmutableRangeMap<Double, LoadingGaugeConstraint> getLoadingGaugeConstraints() {
        return loadingGaugeConstraints;
    }

    @Override
    public RangeMap<Double, String> getVoltages() {
        return catenaryVoltages;
    }

    @Override
    public RangeMap<Double, NeutralSection> getNeutralSections(Direction direction) {
        return neutralSections.get(direction);
    }

    @Override
    public RangeMap<Double, NeutralSection> getNeutralSectionAnnouncements(Direction direction) {
        return neutralSectionAnnouncements.get(direction);
    }

    @Override
    public LineString getGeo() {
        return geo;
    }

    @Override
    public LineString getSch() {
        return sch;
    }
}
