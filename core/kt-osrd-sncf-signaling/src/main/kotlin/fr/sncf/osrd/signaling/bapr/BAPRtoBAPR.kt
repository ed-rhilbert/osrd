package fr.sncf.osrd.signaling.bapr

import fr.sncf.osrd.signaling.*
import fr.sncf.osrd.signaling.ProtectionStatus.*
import fr.sncf.osrd.sim_infra.api.SigSettings
import fr.sncf.osrd.sim_infra.api.SigState
import fr.sncf.osrd.sim_infra.api.SigStateSchema


object BAPRtoBAPR : SignalDriver {
    override val name = "BAPR-BAPR"
    override val inputSignalingSystem = "BAPR"
    override val outputSignalingSystem = "BAPR"

    private fun cascadePrimaryAspect(aspect: String): String {
        return when (aspect) {
            "VL" -> "VL"
            "S" -> "A"
            "C" -> "A"
            "A" -> throw RuntimeException("invalid aspect: A")
            else -> throw RuntimeException("unknown aspect: $aspect")
        }
    }

    override fun evalSignal(
        signal: SigSettings, stateSchema: SigStateSchema, maView: MovementAuthorityView?, limitView: SpeedLimitView?
    ): SigState {
        return stateSchema {
            if (signal.getFlag("distant")) {
                if (maView!!.hasNextSignal)
                    value("aspect", cascadePrimaryAspect(maView.nextSignalState.getEnum("aspect")))
                else
                    value("aspect", "A")
            } else {
                when (maView!!.protectionStatus) {
                    NO_PROTECTED_ZONES -> throw RuntimeException("BAPR signals always protect zones")
                    INCOMPATIBLE -> value("aspect", "C")
                    OCCUPIED -> value("aspect", "S")
                    CLEAR -> value("aspect", "VL")
                }
            }
        }
    }

    override fun checkSignal(reporter: DiagnosisReporter, signal: SigSettings, block: SigBlock) {
    }
}