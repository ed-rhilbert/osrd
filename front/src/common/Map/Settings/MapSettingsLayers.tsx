import React, { FC, ReactNode, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateLayersSettings } from 'reducers/map';
import { GiElectric, GiUnplugged } from 'react-icons/gi';
import { AiOutlineBlock } from 'react-icons/ai';
import { MdSpaceBar } from 'react-icons/md';

import BufferStopSVGFile from 'assets/pictures/layersicons/bufferstop.svg';
import OPsSVGFile from 'assets/pictures/layersicons/ops.svg';
import SwitchesSVGFile from 'assets/pictures/layersicons/switches.svg';
import DetectorsSVGFile from 'assets/pictures/layersicons/detectors.svg';
import SwitchSNCF, { SWITCH_TYPES } from 'common/BootstrapSNCF/SwitchSNCF/SwitchSNCF';
import { RootState } from 'reducers';
import { getMap } from 'reducers/map/selectors';

type LayerSettings = RootState['map']['layersSettings'];

interface FormatSwitchProps {
  name: keyof Omit<LayerSettings, 'speedlimittag'>;
  icon: ReactNode;
  color?: string;
  disabled?: boolean;
}
export const FormatSwitch: FC<FormatSwitchProps> = ({ name, icon, color, disabled }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['map-settings']);
  const { layersSettings } = useSelector(getMap);

  const setLayerSettings = useCallback(
    (setting: keyof LayerSettings) => {
      dispatch(
        updateLayersSettings({
          ...layersSettings,
          [setting]: !layersSettings[setting],
        })
      );
    },
    [dispatch, layersSettings]
  );

  return (
    <div className="d-flex align-items-center mt-1">
      <SwitchSNCF
        id={`${name}-switch`}
        type={SWITCH_TYPES.switch}
        name={`${name}-switch`}
        onChange={() => setLayerSettings(name)}
        checked={layersSettings[name]}
        disabled={disabled}
      />
      <span className={`px-1 d-flex align-items-center ${color}`}>{icon}</span>
      <small>{t(name)}</small>
    </div>
  );
};

export const Icon2SVG: FC<{ file: string; altName?: string }> = ({ file, altName }) => (
  <img src={file} alt={altName} height="16" />
);

const MapSettingsLayers: FC<unknown> = () => (
  <div className="row">
    <div className="col-md-6">
      <FormatSwitch name="catenaries" icon={<GiElectric />} />
    </div>
    <div className="col-md-6">
      <FormatSwitch name="neutral_sections" icon={<GiUnplugged />} />
    </div>
    <div className="col-md-6">
      <FormatSwitch name="signalingtype" icon={<AiOutlineBlock />} disabled />
    </div>
    <div className="col-md-6">
      <FormatSwitch name="tvds" icon={<MdSpaceBar />} disabled />
    </div>
    <div className="col-md-6">
      <FormatSwitch
        name="operationalpoints"
        icon={<Icon2SVG file={OPsSVGFile} altName="Operationnal points svg" />}
      />
    </div>
    <div className="col-md-6">
      <FormatSwitch
        name="switches"
        icon={<Icon2SVG file={SwitchesSVGFile} altName="Switches icon svg" />}
      />
    </div>
    <div className="col-md-6">
      <FormatSwitch
        name="bufferstops"
        icon={<Icon2SVG file={BufferStopSVGFile} altName="Buffer stop svg" />}
      />
    </div>
    <div className="col-md-6">
      <FormatSwitch
        name="detectors"
        icon={<Icon2SVG file={DetectorsSVGFile} altName="Detectors circles svg" />}
      />
    </div>
  </div>
);

export default MapSettingsLayers;
