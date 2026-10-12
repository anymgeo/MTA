import type {MapFeature} from './map-model';
export {splitSegment,moveHandle} from '../../../shared/map-geometry.mjs';
export function featureMode(feature:MapFeature,index:number):'smooth'|'corner'{
  if(feature.anchorModes?.[index])return feature.anchorModes[index];
  const p=feature.points[index];if(p.length!==6)return 'corner';
  const a=[p[2]!-p[0],p[3]!-p[1]],b=[p[4]!-p[0],p[5]!-p[1]];
  return Math.abs(a[0]*b[1]-a[1]*b[0])<.01&&a[0]*b[0]+a[1]*b[1]<0?'smooth':'corner';
}
