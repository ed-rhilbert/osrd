import React from 'react';
import { Layer, LayerProps, useMap } from 'react-map-gl/maplibre';
import { isNumber } from 'lodash';

export type OrderedLayerProps = LayerProps & {
  layerOrder?: number;
};

export default function OrderedLayer(props: OrderedLayerProps) {
  const { current: map } = useMap();
  const { layerOrder, ...restOfLayerProps } = props;

  const layerProps = { ...restOfLayerProps };
  if (isNumber(layerOrder) && map?.getLayer(`virtual-layer-${layerOrder}`)) {
    layerProps.beforeId = `virtual-layer-${layerOrder}`;
  }
  return <Layer {...layerProps} />;
}
