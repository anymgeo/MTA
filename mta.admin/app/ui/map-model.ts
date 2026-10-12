// Anchors remain backward compatible with the original [x, y] format.
// Curved paths add optional incoming and outgoing control points.
export type Point = [number, number, number?, number?, number?, number?];
export type FeatureType = { key: string; nameKa: string; nameEn: string; geometryKind: 'point' | 'line' | 'polygon'; icon: string; color: string; statuses: string[]; active: boolean };
export type MapLabel = { x:number; y:number; textKa:string; textEn:string;cutLine?:boolean;pathPosition?:number|null;gap?:number };
export type MapFeature = {
  id?: string; typeKey: string; geometryKind: 'point' | 'line' | 'polygon'; points: Point[];
  nameKa: string; nameEn: string; descriptionKa: string; descriptionEn: string; status: string;
  difficulty: string; liftType: string; opens: string; closes: string; durationMinutes: number | null;
  anchorModes?: ('smooth'|'corner')[]; label?: MapLabel | null;
  version?: string; createdByName?: string; createdAt?: string; updatedByName?: string; updatedAt?: string;
};
export type ResortMap = { id: string; resortId: string; imageUrl: string; width: number; height: number; placeholder: boolean; version: string; types: FeatureType[]; features: MapFeature[]; tiles?: import('../../../shared/map-geometry.mjs').MapTiles | null };
export type MapOptions = { times: string[]; durations: number[]; difficulties: string[]; liftTypes: string[]; statuses: string[] };
import {MAP_COLORS} from '../../../shared/map-geometry.mjs';
export function featureColor(f: MapFeature, types: FeatureType[]) {return f.typeKey==='trail'?MAP_COLORS[f.difficulty]||MAP_COLORS.easy:MAP_COLORS[f.typeKey]||types.find(t=>t.key===f.typeKey)?.color||'#17231f';}
export const optionLabels: Record<string,string> = {
  easy:'მარტივი / Easy',medium:'საშუალო / Medium',difficult:'რთული / Difficult',
  gondola:'გონდოლა / Gondola',chairlift:'სავარძელი / Chairlift','drag-lift':'ბუგელი / Drag lift','surface-lift':'ზედაპირული / Surface lift','magic-carpet':'კონვეიერი / Magic carpet',
  unknown:'უცნობია / Unknown',open:'ღია / Open',closed:'დახურული / Closed',limited:'შეზღუდული / Limited',operational:'მუშაობს / Operational',maintenance:'ტექნიკური სამუშაო / Maintenance',active:'აქტიური / Active',resolved:'მოგვარებული / Resolved'
};
