import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON.js';

/**
 * 
 * @param {Object} olFeatures - either an array or an object containing openlayer features
 * @returns offsetted openlayers features
 */
export default async function lineOffsetter(olFeatures) {
  let features;
  if (Array.isArray(olFeatures)) {
    features = olFeatures;
  } else {
    olFeatures.getFeatures();
  }
  return Promise.all(
    features.map(async (elm) => {
      const geometry = new GeoJSON().writeGeometryObject(elm.value.getGeometry(), {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const props = elm.value.getProperties();
      if (geometry.type === 'LineString' && geometry.coordinates.length >= 2 && JSON.parse(JSON.stringify(geometry))) {
        let offset;
        try {
          if (props.link_id === 8344 && geometry.coordinates.length >= 3) geometry.coordinates.shift();
          offset = turf.lineOffset(geometry, 2, { units: 'meters' });
          const olgeom = new GeoJSON().readFeature(offset, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          });
          elm.value.getGeometry().setCoordinates(olgeom.getGeometry().getCoordinates());
          props.geometry = elm.value.getGeometry();
          elm.value.setProperties(props, true);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log(err);
        }
      }
    }),
  ).then(() => {
    return olFeatures;
  });
}
