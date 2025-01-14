import React, { FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Slider from 'rc-slider';

import iconIGNBDORTHO from 'assets/pictures/mapbuttons/mapstyle-ortho.jpg';
import iconIGNSCAN25 from 'assets/pictures/mapbuttons/mapstyle-scan25.jpg';
import iconIGNCadastre from 'assets/pictures/mapbuttons/mapstyle-cadastre.jpg';
import iconOSM from 'assets/pictures/mapbuttons/mapstyle-normal.jpg';
import iconOSMTracks from 'assets/pictures/mapbuttons/mapstyle-osm-tracks.jpg';
import SwitchSNCF, {
  SWITCH_TYPES,
  SwitchSNCFProps,
} from 'common/BootstrapSNCF/SwitchSNCF/SwitchSNCF';
import { getMap, getTerrain3DExaggeration } from 'reducers/map/selectors';
import {
  updateShowIGNBDORTHO,
  updateShowIGNCadastre,
  updateShowIGNSCAN25,
  updateShowOSM,
  updateShowOSMtracksections,
  updateTerrain3DExaggeration,
} from 'reducers/map';

const FormatSwitch: FC<{
  name: string;
  onChange: SwitchSNCFProps['onChange'];
  state: boolean;
  icon: string;
  label: string;
}> = ({ name, onChange, state, icon, label }) => {
  const { t } = useTranslation(['map-settings']);
  return (
    <div className="d-flex align-items-center">
      <SwitchSNCF
        id={name}
        type={SWITCH_TYPES.switch}
        name={name}
        onChange={onChange}
        checked={state}
      />
      <img className="ml-2 rounded" src={icon} alt="" height="24" />
      <span className="ml-2">{t(label)}</span>
    </div>
  );
};

const MapSettingsBackgroundSwitches: FC<unknown> = () => {
  const { t } = useTranslation(['map-settings']);
  const { showIGNBDORTHO, showIGNSCAN25, showIGNCadastre, showOSM, showOSMtracksections } =
    useSelector(getMap);
  const terrain3DExaggeration = useSelector(getTerrain3DExaggeration);
  const dispatch = useDispatch();

  return (
    <>
      <FormatSwitch
        name="showosmwitch"
        onChange={() => dispatch(updateShowOSM(!showOSM))}
        state={showOSM}
        icon={iconOSM}
        label="showOSM"
      />
      <div className="my-2" />
      <FormatSwitch
        name="showosmtracksectionswitch"
        onChange={() => dispatch(updateShowOSMtracksections(!showOSMtracksections))}
        state={showOSMtracksections}
        icon={iconOSMTracks}
        label="showOSMtracksections"
      />
      <div className="my-2" />
      <FormatSwitch
        name="showignbdorthoswitch"
        onChange={() => dispatch(updateShowIGNBDORTHO(!showIGNBDORTHO))}
        state={showIGNBDORTHO}
        icon={iconIGNBDORTHO}
        label="showIGNBDORTHO"
      />
      <div className="my-2" />
      <FormatSwitch
        name="showignscan25switch"
        onChange={() => dispatch(updateShowIGNSCAN25(!showIGNSCAN25))}
        state={showIGNSCAN25}
        icon={iconIGNSCAN25}
        label="showIGNSCAN25"
      />
      <div className="my-2" />
      <FormatSwitch
        name="showigncadastreswitch"
        onChange={() => dispatch(updateShowIGNCadastre(!showIGNCadastre))}
        state={showIGNCadastre}
        icon={iconIGNCadastre}
        label="showIGNCadastre"
      />

      <div className="my-3 pb-3">
        <div className="d-flex align-item-center">
          <span className="flex-grow-1">{t('terrain3DExaggeration')}</span>
          <span className="font-weight-bolder">x{terrain3DExaggeration}</span>
        </div>
        <div className="slider p-1">
          <Slider
            min={0}
            defaultValue={1}
            max={5}
            step={0.1}
            marks={{ 0: 0, 0.5: '0.5', 1: 'x1', 2: 'x2', 5: 'x5' }}
            value={terrain3DExaggeration}
            onChange={(value) => dispatch(updateTerrain3DExaggeration(value as number))}
          />
        </div>
      </div>
    </>
  );
};

export default MapSettingsBackgroundSwitches;
