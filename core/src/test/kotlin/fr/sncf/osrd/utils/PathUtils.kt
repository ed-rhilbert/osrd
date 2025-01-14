package fr.sncf.osrd.utils

import fr.sncf.osrd.sim_infra.api.*
import fr.sncf.osrd.utils.indexing.mutableDirStaticIdxArrayListOf
import fr.sncf.osrd.utils.units.Distance


/** Build a path from track ids */
fun pathFromTracks(infra: LocationInfra, trackIds: List<String>,
                           dir: Direction, start: Distance, end: Distance
): PathProperties {
    val chunkList = mutableDirStaticIdxArrayListOf<TrackChunk>()
    trackIds
        .map { id ->  infra.getTrackSectionFromName(id)!! }
        .flatMap { track -> infra.getTrackSectionChunks(track).dirIter(dir) }
        .forEach { dirChunk -> chunkList.add(dirChunk) }
    return buildPathPropertiesFrom(infra, chunkList, start, end)
}
