import { MapLayerMouseEvent } from 'maplibre-gl';
import { Feature, LineString, Point } from 'geojson';
import length from '@turf/length';
import lineSlice from '@turf/line-slice';
import { TrackSectionEntity } from 'types';
import { NearestPoint } from '@turf/nearest-point';
import { TrackState } from './rangeEdition/types';

/**
 * Since Turf and Editoast do not compute the lengths the same way (see #1751)
 * we can have data "end" being larger than Turf's computed length, which
 * throws an error. Until we find a way to get similar computations, we can
 * approximate this way:
 */
export function approximateDistanceWithEditoastData(track: TrackSectionEntity, point: Point) {
  const distanceAlongTrack =
    (length(lineSlice(track.geometry.coordinates[0], point, track)) * track.properties.length) /
    length(track);
  return distanceAlongTrack;
}

/** return the trackRanges near the mouse thanks to the hover event */
export function getHoveredTrackRanges(hoverEvent: MapLayerMouseEvent) {
  const { point, target: map } = hoverEvent;
  const TOLERANCE = 20;

  return map.queryRenderedFeatures(
    [
      [point.x - TOLERANCE / 2, point.y - TOLERANCE / 2],
      [point.x + TOLERANCE / 2, point.y + TOLERANCE / 2],
    ],
    {
      layers: ['editor/geo/track-main'],
    }
  ) as Feature<LineString>[];
}

/**
 * Given a point and trackSectionsCache, return the cached trackSection on which the point is.
 * If the trackSection is not in the cache, then return null.
 */
export function getTrackSectionEntityFromNearestPoint(
  point: NearestPoint,
  trackRanges: Feature<LineString>[],
  trackSectionsCache: Record<string, TrackState>
) {
  const currentTrackRange = trackRanges[point.properties.featureIndex];
  if (!currentTrackRange.id) return null;
  const trackState = trackSectionsCache[currentTrackRange.id];
  if (trackState?.type !== 'success') return null;
  const { track } = trackState;
  return track;
}
