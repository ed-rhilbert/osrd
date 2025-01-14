package fr.sncf.osrd.sim_infra.impl

import fr.sncf.osrd.sim_infra.api.*
import fr.sncf.osrd.utils.indexing.*
import fr.sncf.osrd.utils.units.*


interface BlockInfraBuilder {
    fun block(
        startAtBufferStop: Boolean,
        stopsAtBufferStop: Boolean,
        path: StaticIdxList<ZonePath>,
        signals: StaticIdxList<LogicalSignal>,
        signalsDistances: OffsetList<Block>,
    ): BlockId
}


class BlockInfraBuilderImpl(val loadedSignalInfra: LoadedSignalInfra, val rawInfra: RawInfra) : BlockInfraBuilder {
    private val blockSet = mutableMapOf<BlockDescriptor, BlockId>()
    private val blockPool = StaticPool<Block, BlockDescriptor>()
    override fun block(
        startAtBufferStop: Boolean,
        stopsAtBufferStop: Boolean,
        path: StaticIdxList<ZonePath>,
        signals: StaticIdxList<LogicalSignal>,
        signalsDistances: OffsetList<Block>,
    ): BlockId {
        assert(path.size != 0)

        var length = Length<Block>(0.meters)
        for (zonePath in path)
            length += rawInfra.getZonePathLength(zonePath).distance

        val newBlock = BlockDescriptor(length, startAtBufferStop, stopsAtBufferStop, path, signals, signalsDistances)
        return blockSet.getOrPut(newBlock) { blockPool.add(newBlock) }
    }

    fun build(): BlockInfra {
        return BlockInfraImpl(blockPool, loadedSignalInfra, rawInfra)
    }
}


fun blockInfraBuilder(
    loadedSignalInfra: LoadedSignalInfra,
    rawInfra: RawInfra,
    init: BlockInfraBuilder.() -> Unit,
): BlockInfra {
    val builder = BlockInfraBuilderImpl(loadedSignalInfra, rawInfra)
    builder.init()
    return builder.build()
}
