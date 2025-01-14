/* eslint-disable no-console */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';

import { FeatureCollection } from 'geojson';
import ReactMapGL, { LayerProps, MapRef, Source } from 'react-map-gl/maplibre';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { featureCollection } from '@turf/helpers';
import { map, sum, uniqBy } from 'lodash';

import mapStyleJson from 'assets/mapstyles/OSMStyle.json';
import { LayerType } from 'applications/editor/tools/types';
import osmBlankStyle from 'common/Map/Layers/osmBlankStyle';
import GeoJSONs from 'common/Map/Layers/GeoJSONs';
import colors from 'common/Map/Consts/colors';
import { getMap } from 'reducers/map/selectors';
import { OSM_URL } from 'common/Map/const';
import { simplifyFeature } from 'common/Map/WarpedMap/core/helpers';
import OrderedLayer from 'common/Map/Layers/OrderedLayer';
import { transformMapRequest } from 'reducers/map';

const TIME_LABEL = 'Loading OSRD and OSM data around warped path';

const OSM_LAYERS = new Set(['building', 'water', 'water_name', 'waterway', 'poi']);

/**
 * This component handles loading entities from MapLibre vector servers, and retrieving them as GeoJSONs from the
 * MapLibre `querySourceFeatures` method.
 * It's quite dirty (it has to mount a map in the DOM, but somewhere it won't be visible), but necessary until we get
 * proper APIs for both OSRD data and OSM data.
 *
 * It is designed as a component instead of a hook to simplify mounting/unmounting the temporary invisible map.
 */
const DataLoader: FC<{
  bbox: BBox2d;
  getGeoJSONs: (
    osrdData: Partial<Record<LayerType, FeatureCollection>>,
    osmData: Record<string, FeatureCollection>
  ) => void;
  layers: Set<LayerType>;
}> = ({ bbox, getGeoJSONs, layers }) => {
  const { mapStyle, layersSettings } = useSelector(getMap);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [state, setState] = useState<'idle' | 'render' | 'loaded'>('idle');
  const osmLayers = useMemo(() => {
    const osmStyle = (mapStyleJson as LayerProps[]).filter(
      (layer) => layer.id && OSM_LAYERS.has(layer.id)
    );
    return osmStyle
      .map((layer) => ({
        ...layer,
        key: layer.id,
        id: `osm/${layer.id}`,
      }))
      .map((layer) => <OrderedLayer {...layer} />);
  }, []);

  useEffect(() => {
    if (!mapRef) return;

    mapRef.fitBounds(bbox, { animate: false });
    setTimeout(() => {
      console.time(TIME_LABEL);
      setState('render');
    }, 0);
  }, [mapRef, bbox]);

  useEffect(() => {
    if (state === 'render') {
      const m = mapRef as MapRef;

      const querySources = () => {
        // Retrieve OSRD data:
        let osrdFeaturesCount = 0;
        const osrdData: Partial<Record<LayerType, FeatureCollection>> = {};
        layers.forEach((layer) => {
          osrdData[layer] = featureCollection(
            uniqBy(
              m
                .querySourceFeatures(`editor/geo/${layer}`, { sourceLayer: layer })
                .map(simplifyFeature),
              (f) => f.id
            )
          );
          osrdFeaturesCount += osrdData[layer]?.features.length || 0;
        });

        // Retrieve OSM data:
        // (we have to force cast, because in our weird setup, osmSource is
        // typed as if it was from mapbox when it actually comes from maplibre)
        const osmSource = m.getSource('osm') as unknown as { vectorLayerIds: string[] };
        let incrementalID = 1;
        const osmData: Record<string, FeatureCollection> = osmSource.vectorLayerIds.reduce(
          (iter, sourceLayer) =>
            OSM_LAYERS.has(sourceLayer)
              ? {
                  ...iter,
                  [sourceLayer]: featureCollection(
                    uniqBy(
                      m.querySourceFeatures('osm', { sourceLayer }).map(simplifyFeature),
                      // eslint-disable-next-line no-plusplus
                      (f) => (f.id ? `osm-${f.id}` : `generated-${++incrementalID}`) // only deduplicate features with IDs
                    )
                  ),
                }
              : iter,
          {}
        );
        const osmFeaturesCount = sum(map(osmData, (collection) => collection.features.length));

        console.timeEnd(TIME_LABEL);
        console.log('  - OSRD features: ', osrdFeaturesCount);
        console.log('  - OSM features: ', osmFeaturesCount);

        // Finalize:
        getGeoJSONs(osrdData, osmData);
        setState('loaded');
      };

      m.on('idle', querySources);

      return () => {
        m.off('idle', querySources);
      };
    }

    return undefined;
  }, [state]);

  return state !== 'loaded'
    ? createPortal(
        <div
          className="position-absolute"
          style={{
            bottom: '110%',
            height: 1200,
            width: 1200,
          }}
        >
          <ReactMapGL
            ref={setMapRef}
            mapStyle={osmBlankStyle}
            style={{ width: '100%', height: '100%' }}
            transformRequest={transformMapRequest}
          >
            {state === 'render' && (
              <>
                <Source id="osm" type="vector" url={OSM_URL}>
                  {osmLayers}
                </Source>
                <GeoJSONs
                  colors={colors[mapStyle]}
                  layersSettings={layersSettings}
                  isEmphasized={false}
                  layers={layers}
                  renderAll
                />
              </>
            )}
          </ReactMapGL>
        </div>,
        document.body
      )
    : null;
};

export default DataLoader;
