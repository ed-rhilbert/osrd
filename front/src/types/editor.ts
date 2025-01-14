import { JSONSchema7 } from 'json-schema';
import { Feature, GeoJsonProperties, Geometry, Point, LineString, MultiLineString } from 'geojson';

import { Direction, ObjectType, DirectionalTrackRange } from '../common/api/osrdEditoastApi';
import { NullGeometry } from './geospatial';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EditorModelsDefinition = any;

//
// Editor data model
//
export type EditorEntityType = ObjectType;
export type EntityId = string | undefined;
export type EditorSchema = Array<{ layer: string; objType: EditorEntityType; schema: JSONSchema7 }>;
export type EditorEntity<G extends Geometry | null = Geometry, P = GeoJsonProperties> = Omit<
  Feature<G, P & { id: string }> & { objType: EditorEntityType },
  'id'
>;

export interface TrackSectionEntity
  extends EditorEntity<
    LineString,
    {
      length: number;
      extensions?: {
        sncf?: {
          line_code?: number;
          line_name?: string;
          track_name?: string;
          track_number?: number;
        };
      };
    }
  > {
  objType: 'TrackSection';
}

export const APPLICABLE_DIRECTIONS = ['BOTH', 'START_TO_STOP', 'STOP_TO_START'] as const;
export type ApplicableDirection = (typeof APPLICABLE_DIRECTIONS)[number];
export interface PSLSign {
  angle_sch: number;
  angle_geo: number;
  position: number;
  side: 'LEFT' | 'RIGHT' | 'CENTER';
  track: string;
  type: string;
  value: string | null;
}

export interface PSLExtension {
  announcement: PSLSign[];
  z: PSLSign;
  r: PSLSign[];
}
export interface SpeedSectionProperties {
  speed_limit?: number;
  speed_limit_by_tag?: Record<string, number | undefined>;
  track_ranges?: {
    applicable_directions: ApplicableDirection;
    begin: number;
    end: number;
    track: string;
  }[];
  extensions?: {
    psl_sncf: null | PSLExtension;
  };
}
export interface SpeedSectionPslEntity
  extends EditorEntity<
    MultiLineString,
    Omit<SpeedSectionProperties, 'extensions'> & { extensions: { psl_sncf: PSLExtension } }
  > {
  objType: 'SpeedSection';
}
export interface SpeedSectionEntity extends EditorEntity<MultiLineString, SpeedSectionProperties> {
  objType: 'SpeedSection';
}

export interface CatenaryProperties {
  id: string;
  track_ranges?: {
    applicable_directions: ApplicableDirection;
    begin: number;
    end: number;
    track: string;
  }[];
  voltage?: string;
}

export interface CatenaryEntity extends EditorEntity<MultiLineString, CatenaryProperties> {
  objType: 'Catenary';
}
export interface SignalEntity
  extends EditorEntity<
    Point | NullGeometry,
    {
      track?: string;
      position?: number;
      extensions: {
        sncf: {
          is_in_service?: boolean;
          is_lightable?: boolean;
          is_operational?: boolean;
          installation_type?: string;
        };
      };
    }
  > {
  objType: 'Signal';
}
export interface BufferStopEntity<T extends Point | NullGeometry = Point | NullGeometry>
  extends EditorEntity<T, { track?: string; position?: number }> {
  objType: 'BufferStop';
}
export interface DetectorEntity<T extends Point | NullGeometry = Point | NullGeometry>
  extends EditorEntity<T, { track?: string; position?: number }> {
  objType: 'Detector';
}

//
// Direction
//
export const DIRECTIONS: Array<Direction> = ['START_TO_STOP', 'STOP_TO_START'];
export const DIRECTIONS_SET = new Set(DIRECTIONS);
export const DEFAULT_DIRECTION = DIRECTIONS[0];
export type { Direction, DirectionalTrackRange as TrackRange };

//
// Waypoint
//
export interface WayPoint {
  type: 'BufferStop' | 'Detector';
  id: string;
}
export type WayPointEntity = BufferStopEntity<Point> | DetectorEntity<Point>;
export interface RouteEntity
  extends EditorEntity<
    NullGeometry,
    {
      entry_point: WayPoint;
      entry_point_direction: Direction;
      exit_point: WayPoint;
      switches_directions: Record<string, string>;
      release_detectors: string[];
    }
  > {
  objType: 'Route';
}

export const ENDPOINTS = ['BEGIN', 'END'] as const;
export const ENDPOINTS_SET = new Set(ENDPOINTS);
export const DEFAULT_ENDPOINT = ENDPOINTS[0];
export type EndPoint = (typeof ENDPOINTS)[number];
export interface SwitchPortConnection {
  src: string;
  dst: string;
  bidirectionnal: boolean;
}
export interface TrackEndpoint {
  endpoint: EndPoint;
  track: string;
}
export interface SwitchType {
  id: string;
  ports: string[];
  groups: Record<string, SwitchPortConnection[]>;
}
export interface SwitchEntity
  extends EditorEntity<
    Point,
    {
      switch_type: string;
      ports: Record<string, TrackEndpoint>;
      extensions?: {
        sncf: {
          label?: string;
        };
      };
    }
  > {
  objType: 'Switch';
}
