import React from 'react';
import Card from 'common/BootstrapSNCF/CardSNCF/CardSNCF';
import NavBarSNCF from 'common/BootstrapSNCF/NavBarSNCF';
import mapImg from 'assets/pictures/home/map.svg';
import editorImg from 'assets/pictures/home/editor.svg';
import rollingStockEditorImg from 'assets/pictures/home/rollingstockeditor.svg';
import stdcmImg from 'assets/pictures/home/stdcm.svg';
import operationalStudiesImg from 'assets/pictures/home/operationalStudies.svg';
import logo from 'assets/logo_osrd_seul_blanc.svg';
import osrdLogo from 'assets/pictures/osrd.png';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation('home/home');

  return (
    <>
      <NavBarSNCF appName="OSRD" logo={logo} />
      <main className="mastcontainer mastcontainer-no-mastnav">
        <div className="application-title">
          <img src={osrdLogo} alt="OSRD logo" />
          <h1>Open Source Railway Designer</h1>
        </div>
        <div className="cardscontainer">
          <div className="row">
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
              <Card
                img={operationalStudiesImg}
                title={t('operationalStudies')}
                link="/operational-studies"
                data-testid="operationalStudies"
              />
            </div>
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
              <Card img={mapImg} title={t('map')} link="/map" />
            </div>
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
              <Card img={editorImg} title={t('editor')} link="/editor" />
            </div>
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
              <Card
                img={rollingStockEditorImg}
                title={t('rollingStockEditor')}
                link="/rolling-stock-editor"
              />
            </div>
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
              <Card img={stdcmImg} title={t('stdcm')} link="/stdcm" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
