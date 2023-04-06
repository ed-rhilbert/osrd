import React, { useEffect, useState } from 'react';
import NavBarSNCF from 'common/BootstrapSNCF/NavBarSNCF';
import logo from 'assets/pictures/home/operationalStudies.svg';
import { useTranslation } from 'react-i18next';
import Timetable from 'applications/operationalStudies/components/Scenario/Timetable';
import infraLogo from 'assets/pictures/components/tracks.svg';
import ScenarioLoader from 'applications/operationalStudies/components/Scenario/ScenarioLoader';
import { useSelector, useDispatch } from 'react-redux';
import { MODES, MANAGE_TRAIN_SCHEDULE_TYPES } from 'applications/operationalStudies/consts';
import { updateInfraID, updateMode, updateTimetableID } from 'reducers/osrdconf';
import TimetableManageTrainSchedule from 'applications/operationalStudies/components/Scenario/TimetableManageTrainSchedule';
import BreadCrumbs from 'applications/operationalStudies/components/BreadCrumbs';
import {
  getProjectID,
  getScenarioID,
  getStudyID,
  getTimetableID,
} from 'reducers/osrdconf/selectors';
import { useModal } from 'common/BootstrapSNCF/ModalSNCF';
import { FaPencilAlt } from 'react-icons/fa';
import { GiElectric } from 'react-icons/gi';
import { setSuccess } from 'reducers/main';
import { useNavigate } from 'react-router-dom';
import { osrdEditoastApi } from 'common/api/osrdEditoastApi';
import { RootState } from 'reducers';
import AddAndEditScenarioModal from '../components/Scenario/AddOrEditScenarioModal';
import getTimetable from '../components/Scenario/getTimetable';
import ImportTrainSchedule from './ImportTrainSchedule';
import ManageTrainSchedule from './ManageTrainSchedule';
import SimulationResults from './SimulationResults';

export default function Scenario() {
  const dispatch = useDispatch();
  const { t } = useTranslation('operationalStudies/scenario');
  const isUpdating = useSelector((state: RootState) => state.osrdsimulation.isUpdating);
  const [trainScheduleIDsToModify, setTrainScheduleIDsToModify] = useState<number[]>();
  const [displayTrainScheduleManagement, setDisplayTrainScheduleManagement] = useState<string>(
    MANAGE_TRAIN_SCHEDULE_TYPES.none
  );

  const [getProject, { data: project }] =
    osrdEditoastApi.endpoints.getProjectsByProjectId.useLazyQuery({});
  const [getStudy, { data: study }] =
    osrdEditoastApi.endpoints.getProjectsByProjectIdStudiesAndStudyId.useLazyQuery({});
  const [getScenario, { data: scenario }] =
    osrdEditoastApi.endpoints.getProjectsByProjectIdStudiesAndStudyIdScenariosScenarioId.useLazyQuery(
      {}
    );

  const { openModal } = useModal();
  const navigate = useNavigate();
  const projectId = useSelector(getProjectID);
  const studyId = useSelector(getStudyID);
  const scenarioId = useSelector(getScenarioID);
  const timetableId = useSelector(getTimetableID);

  const getScenarioTimetable = async (withNotification = false) => {
    if (projectId && studyId && scenarioId) {
      getScenario({ projectId, studyId, scenarioId })
        .unwrap()
        .then((result) => {
          dispatch(updateTimetableID(result.timetable_id));
          dispatch(updateInfraID(result.infra_id));

          const preferedTimetableId = result.timetable_id || timetableId;

          getTimetable(preferedTimetableId);
          if (withNotification) {
            dispatch(
              setSuccess({
                title: t('scenarioUpdated'),
                text: t('scenarioUpdatedDetails', { name: result.name }),
              })
            );
          }
        });
    }
  };

  useEffect(() => {
    if (!scenarioId || !studyId || !projectId) {
      navigate('/operational-studies/study');
    } else {
      getProject({ projectId });
      getStudy({ projectId, studyId });
      getScenarioTimetable();
      dispatch(updateMode(MODES.simulation));
    }
    return () => {
      dispatch(updateTimetableID(undefined));
      dispatch(updateInfraID(undefined));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return scenario ? (
    <>
      <NavBarSNCF
        appName={
          <BreadCrumbs
            projectName={project?.name}
            studyName={study?.name}
            scenarioName={scenario.name}
          />
        }
        logo={logo}
      />
      <main className="mastcontainer mastcontainer-no-mastnav">
        <div className="scenario">
          {isUpdating && <ScenarioLoader msg={t('isUpdating')} />}
          <div className="row">
            <div className="col-lg-4">
              <div className="scenario-sidemenu">
                {scenario && (
                  <div className="scenario-details">
                    <div className="scenario-details-name">
                      {scenario.name}
                      <button
                        className="scenario-details-modify-button"
                        type="button"
                        onClick={() =>
                          openModal(
                            <AddAndEditScenarioModal
                              editionMode
                              scenario={scenario}
                              getScenarioTimetable={getScenarioTimetable}
                            />
                          )
                        }
                      >
                        <span className="scenario-details-modify-button-text">
                          {t('modifyScenario')}
                        </span>
                        <FaPencilAlt />
                      </button>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="scenario-details-infra-name">
                          <img src={infraLogo} alt="Infra logo" className="mr-2" />
                          {scenario.infra_name}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="scenario-details-electrical-profile-set">
                          <span className="mr-2">
                            <GiElectric />
                          </span>
                          {scenario.electrical_profile_set_name
                            ? scenario.electrical_profile_set_name
                            : t('noElectricalProfileSet')}
                        </div>
                      </div>
                    </div>
                    <div className="scenario-details-description">{scenario.description}</div>
                  </div>
                )}
                {displayTrainScheduleManagement !== MANAGE_TRAIN_SCHEDULE_TYPES.none && (
                  <TimetableManageTrainSchedule
                    setDisplayTrainScheduleManagement={setDisplayTrainScheduleManagement}
                  />
                )}
                <Timetable
                  setDisplayTrainScheduleManagement={setDisplayTrainScheduleManagement}
                  setTrainScheduleIDsToModify={setTrainScheduleIDsToModify}
                />
              </div>
            </div>
            <div className="col-lg-8">
              {(displayTrainScheduleManagement === MANAGE_TRAIN_SCHEDULE_TYPES.add ||
                displayTrainScheduleManagement === MANAGE_TRAIN_SCHEDULE_TYPES.edit) && (
                <div className="scenario-managetrainschedule">
                  <ManageTrainSchedule
                    setDisplayTrainScheduleManagement={setDisplayTrainScheduleManagement}
                    trainScheduleIDsToModify={trainScheduleIDsToModify}
                  />
                </div>
              )}
              {displayTrainScheduleManagement === MANAGE_TRAIN_SCHEDULE_TYPES.import && (
                <div className="scenario-managetrainschedule">
                  <ImportTrainSchedule />
                </div>
              )}
              <div className="scenario-results">
                <SimulationResults />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  ) : null;
}