import React from 'react';
import { Layer } from 'react-map-gl';
import { range } from 'lodash';

export const VIRTUAL_LAYERS = 8;

export default function VirtualLayers() {
  const layers = range(0, VIRTUAL_LAYERS)
    .reverse()
    .map((n) => {
      const before =
        n < VIRTUAL_LAYERS - 1
          ? {
              beforeId: `virtual-layer-${n + 1}`,
            }
          : {};
      return (
        <Layer
          key={`virtual-layer-${n}`}
          id={`virtual-layer-${n}`}
          type="background"
          layout={{ visibility: 'none' }}
          paint={{}}
          {...before}
        />
      );
    });
  return <>{layers}</>;
}