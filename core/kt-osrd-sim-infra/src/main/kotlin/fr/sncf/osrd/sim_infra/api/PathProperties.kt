package fr.sncf.osrd.sim_infra.api

import fr.sncf.osrd.geom.LineString
import fr.sncf.osrd.reporting.exceptions.ErrorType
import fr.sncf.osrd.reporting.exceptions.OSRDError
import fr.sncf.osrd.sim_infra.impl.NeutralSection
import fr.sncf.osrd.sim_infra.impl.PathPropertiesImpl
import fr.sncf.osrd.utils.DistanceRangeMap
import fr.sncf.osrd.utils.indexing.DirStaticIdxList
import fr.sncf.osrd.utils.indexing.StaticIdx
import fr.sncf.osrd.utils.indexing.mutableDirStaticIdxArrayListOf
import fr.sncf.osrd.utils.units.Distance
import fr.sncf.osrd.utils.units.Offset
import fr.sncf.osrd.utils.units.Speed
import fr.sncf.osrd.utils.units.meters

data class IdxWithOffset<T>(
    @get:JvmName("getValue")
    val value: StaticIdx<T>,
    @get:JvmName("getOffset")
    val offset: Distance,
)

data class TrackLocation(
    @get:JvmName("getTrackId")
    val trackId: TrackSectionId,
    @get:JvmName("getOffset")
    val offset: Offset<TrackSection>
)

@Suppress("INAPPLICABLE_JVM_NAME")
interface PathProperties {
    fun getSlopes(): DistanceRangeMap<Double>
    fun getOperationalPointParts(): List<IdxWithOffset<OperationalPointPart>>
    fun getGradients(): DistanceRangeMap<Double>
    fun getCurves(): DistanceRangeMap<Double>
    fun getGeo(): LineString
    fun getLoadingGauge(): DistanceRangeMap<LoadingGaugeConstraint>
    @JvmName("getCatenary")
    fun getCatenary(): DistanceRangeMap<String>
    @JvmName("getNeutralSections")
    fun getNeutralSections(): DistanceRangeMap<NeutralSection>
    @JvmName("getSpeedLimits")
    fun getSpeedLimits(trainTag: String?): DistanceRangeMap<Speed>
    @JvmName("getLength")
    fun getLength(): Distance
    @JvmName("getTrackLocationAtOffset")
    fun getTrackLocationAtOffset(pathOffset: Distance): TrackLocation
    @JvmName("getTrackLocationOffset")
    fun getTrackLocationOffset(location: TrackLocation): Distance?
    fun <T> getRangeMapFromUndirected(getData: (chunkId: TrackChunkId) -> DistanceRangeMap<T>): DistanceRangeMap<T>

    val chunks: DirStaticIdxList<TrackChunk>
    /** Returns the offset where the train starts (must be located on the first chunk) */
    val beginOffset: Distance
}

/** Build a Path from chunks and offsets, filtering the chunks outside the offsets */
@JvmName("buildPathPropertiesFrom")
fun buildPathPropertiesFrom(
    infra: TrackProperties,
    chunks: DirStaticIdxList<TrackChunk>,
    pathBeginOffset: Distance,
    pathEndOffset: Distance,
): PathProperties {
    val filteredChunks = mutableDirStaticIdxArrayListOf<TrackChunk>()
    var totalLength = 0.meters
    var mutBeginOffset = pathBeginOffset
    var mutEndOffset = pathEndOffset
    for (dirChunkId in chunks) {
        if (totalLength >= pathEndOffset)
            break
        val length = infra.getTrackChunkLength(dirChunkId.value)
        val blockEndOffset = totalLength + length.distance

        // if the block ends before the path starts, it can be safely skipped
        // If a block ends where the path starts, it can be skipped too
        if (pathBeginOffset >= blockEndOffset) {
            mutBeginOffset -= length.distance
            mutEndOffset -= length.distance
        } else {
            filteredChunks.add(dirChunkId)
        }
        totalLength += length.distance
    }
    return PathPropertiesImpl(infra, filteredChunks, mutBeginOffset, mutEndOffset)
}

/** For java interoperability purpose */
@JvmName("makeTrackLocation")
fun makeTrackLocation(track: TrackSectionId, offset: Offset<TrackSection>): TrackLocation {
    return TrackLocation(track, offset)
}
