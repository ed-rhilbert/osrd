package fr.sncf.osrd.infra_state;

import static fr.sncf.osrd.Helpers.*;
import static org.junit.jupiter.api.Assertions.assertNull;

import fr.sncf.osrd.TestConfig;
import fr.sncf.osrd.infra_state.routes.RouteStatus;
import fr.sncf.osrd.simulation.SimulationError;
import fr.sncf.osrd.simulation.changelog.ArrayChangeLog;
import org.junit.jupiter.api.Test;

public class TVDSectionStateTest {
    @Test
    public void testSimpleReserve() {
        var changelog = new ArrayChangeLog();
        var testConfig = TestConfig.readResource("tiny_infra/config_railjson.json")
                        .withChangeConsumer(changelog);
        testConfig.rjsSimulation.trainSchedules.clear();
        var preparedSim = testConfig.prepare();
        var sim = preparedSim.sim;

        var tvd = sim.infra.tvdSections.get("tvd.foo_a");
        var tvdState = sim.infraState.getTvdSectionState(tvd.index);

        makeFunctionEvent(sim, 1, () -> tvdState.reserve(sim));
        makeFunctionEvent(sim, 2, () -> tvdState.free(sim));

        var routeAC1 = sim.infra.routeGraph.routeMap.get("rt.buffer_stop_a-C1");
        var routeAC1State = sim.infraState.getRouteState(routeAC1.index);
        var routeC6A = sim.infra.routeGraph.routeMap.get("rt.C6-buffer_stop_a");
        var routeC6AState = sim.infraState.getRouteState(routeC6A.index);
        makeAssertEvent(sim, 1.1, () -> routeAC1State.status == RouteStatus.CONFLICT);
        makeAssertEvent(sim, 1.1, () -> routeC6AState.status == RouteStatus.CONFLICT);
        makeAssertEvent(sim, 1.1, () -> tvdState.isReserved());
        makeAssertEvent(sim, 2.1, () -> routeAC1State.status == RouteStatus.FREE);
        makeAssertEvent(sim, 2.1, () -> routeC6AState.status == RouteStatus.FREE);
        makeAssertEvent(sim, 2.1, () -> ! tvdState.isReserved());

        preparedSim.run();
    }

    @Test
    public void testOccupy() throws SimulationError {
        var changelog = new ArrayChangeLog();
        var testConfig = TestConfig.readResource("tiny_infra/config_railjson.json")
                .withChangeConsumer(changelog);
        testConfig.rjsSimulation.trainSchedules.clear();
        var preparedSim = testConfig.prepare();
        var sim = preparedSim.sim;

        var tvd = sim.infra.tvdSections.get("tvd.foo_a");
        var tvdState = sim.infraState.getTvdSectionState(tvd.index);
        var route = sim.infra.routeGraph.routeMap.get("rt.buffer_stop_a-C1");
        var routeState = sim.infraState.getRouteState(route.index);

        routeState.reserve(sim);

        makeFunctionEvent(sim, 1, () -> tvdState.occupy(sim));
        makeFunctionEvent(sim, 2, () -> tvdState.unoccupy(sim));

        makeAssertEvent(sim, 1.1, () -> routeState.status == RouteStatus.OCCUPIED);
        makeAssertEvent(sim, 2.1, () -> routeState.status == RouteStatus.FREE);

        preparedSim.run();
    }
}
