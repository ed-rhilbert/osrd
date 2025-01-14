import React, { useEffect, useMemo, useState } from 'react';
import projectsLogo from 'assets/pictures/views/projects.svg';
import scenarioExploratorLogo from 'assets/pictures/views/scenarioExplorator.svg';
import scenariosLogo from 'assets/pictures/views/scenarios.svg';
import studiesLogo from 'assets/pictures/views/studies.svg';
import ModalBodySNCF from 'common/BootstrapSNCF/ModalSNCF/ModalBodySNCF';
import ModalHeaderSNCF from 'common/BootstrapSNCF/ModalSNCF/ModalHeaderSNCF';
import { useTranslation } from 'react-i18next';
import { MdArrowRight } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { ScenarioListResult, StudyResult, osrdEditoastApi } from 'common/api/osrdEditoastApi';
import { setFailure } from 'reducers/main';
import ProjectMiniCard from './ScenarioExplorerModalProjectMiniCard';
import ScenarioMiniCard from './ScenarioExplorerModalScenarioMiniCard';
import StudyMiniCard from './ScenarioExplorerModalStudyMiniCard';
import { ScenarioExplorerProps } from './ScenarioExplorerTypes';

export default function ScenarioExplorerModal({
  globalProjectId,
  globalStudyId,
  globalScenarioId,
}: ScenarioExplorerProps) {
  const { t } = useTranslation('common/scenarioExplorer');
  const dispatch = useDispatch();

  const [projectID, setProjectID] = useState<number | undefined>(globalProjectId);
  const [studyID, setStudyID] = useState<number | undefined>(globalStudyId);
  const [scenarioID, setScenarioID] = useState<number | undefined>(globalScenarioId);
  const [studiesList, setStudiesList] = useState<StudyResult[]>();
  const [scenariosList, setScenariosList] = useState<ScenarioListResult[]>();
  const {
    projectsList,
    isError: isProjectsError,
    error: projectsError,
  } = osrdEditoastApi.useGetProjectsQuery(
    { ordering: 'NameAsc', pageSize: 1000 },
    {
      selectFromResult: (response) => ({
        ...response,
        projectsList: response.data?.results || [],
      }),
    }
  );

  const [getStudiesList] = osrdEditoastApi.useLazyGetProjectsByProjectIdStudiesQuery();
  const [getScenariosList] =
    osrdEditoastApi.useLazyGetProjectsByProjectIdStudiesAndStudyIdScenariosQuery();

  useEffect(() => {
    if (isProjectsError) {
      dispatch(
        setFailure({
          name: t('errorMessages.error'),
          message: t('errorMessages.unableToRetrieveProjectsMessage'),
        })
      );
      console.error('error : ', projectsError);
    }
  }, [isProjectsError]);

  useEffect(() => {
    if (projectID && !isProjectsError) {
      getStudiesList({ projectId: projectID, ordering: 'NameAsc', pageSize: 1000 })
        .unwrap()
        .then(({ results }) => setStudiesList(results))
        .catch((error) => console.error(error));
    }
    setStudyID(undefined);
    setScenariosList(undefined);
  }, [projectID]);

  useEffect(() => {
    if (projectID && studyID && !isProjectsError) {
      getScenariosList({
        projectId: projectID,
        studyId: studyID,
        ordering: 'NameAsc',
        pageSize: 1000,
      })
        .unwrap()
        .then(({ results }) => setScenariosList(results))
        .catch((error) => console.error(error));
    }
  }, [studyID]);

  return (
    <div className="scenario-explorator-modal">
      <ModalHeaderSNCF withCloseButton>
        <h1 className="scenario-explorator-modal-title">
          <img src={scenarioExploratorLogo} alt="Scenario explorator Logo" />
          {t('scenarioExplorator')}
        </h1>
      </ModalHeaderSNCF>
      <ModalBodySNCF>
        <div className="row">
          <div className="col-lg-4">
            <div className="scenario-explorator-modal-part projects">
              <div className="scenario-explorator-modal-part-title">
                <img src={projectsLogo} alt="projects logo" />
                <h2>{t('projects')}</h2>
                {projectsList && (
                  <span className="scenario-explorator-modal-part-title-count">
                    {projectsList.length}
                  </span>
                )}
              </div>
              <div className="scenario-explorator-modal-part-itemslist">
                {useMemo(
                  () =>
                    projectsList.length > 0 &&
                    projectsList.map((project) => (
                      <ProjectMiniCard
                        project={project}
                        setSelectedID={setProjectID}
                        isSelected={project.id === projectID}
                        key={`scenario-explorator-modal-${project.id}`}
                      />
                    )),
                  [projectsList, projectID]
                )}
              </div>
              <div className="scenario-explorator-modal-part-arrow">
                <MdArrowRight />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="scenario-explorator-modal-part studies">
              <div className="scenario-explorator-modal-part-title">
                <img src={studiesLogo} alt="studies logo" />
                <h2>{t('studies')}</h2>
                {studiesList && (
                  <span className="scenario-explorator-modal-part-title-count">
                    {studiesList.length}
                  </span>
                )}
              </div>
              <div className="scenario-explorator-modal-part-itemslist">
                {useMemo(
                  () =>
                    studiesList &&
                    studiesList.map((study) => (
                      <StudyMiniCard
                        study={study}
                        setSelectedID={setStudyID}
                        isSelected={study.id === studyID}
                        key={`scenario-explorator-modal-${study.id}`}
                      />
                    )),
                  [studiesList, studyID]
                )}
              </div>
              <div className="scenario-explorator-modal-part-arrow">
                <MdArrowRight />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="scenario-explorator-modal-part scenarios">
              <div className="scenario-explorator-modal-part-title">
                <img src={scenariosLogo} alt="scenarios logo" />
                <h2>{t('scenarios')}</h2>
                {scenariosList && (
                  <span className="scenario-explorator-modal-part-title-count">
                    {scenariosList.length}
                  </span>
                )}
              </div>
              <div className="scenario-explorator-modal-part-itemslist">
                {useMemo(
                  () =>
                    projectID &&
                    studyID &&
                    scenariosList &&
                    scenariosList.map((scenario) => (
                      <ScenarioMiniCard
                        scenario={scenario}
                        setSelectedID={setScenarioID}
                        isSelected={scenario.id === scenarioID}
                        projectID={projectID}
                        studyID={studyID}
                        key={`scenario-explorator-modal-${scenario.id}`}
                      />
                    )),
                  [scenariosList, scenarioID]
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalBodySNCF>
    </div>
  );
}
