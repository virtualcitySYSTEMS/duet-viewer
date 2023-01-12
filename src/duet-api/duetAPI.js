import {
  TerrainLayer,
  CesiumTilesetLayer,
  GeoJSONLayer,
  WMSLayer,
  TMSLayer,
  WMTSLayer,
  VectorTileLayer,
  PointCloudLayer,
  MVTTileProvider,
  StaticGeoJSONTileProvider,
  parseGeoJSON,
} from '@vcmap/core';
import { LayerContentTreeItem, NodeContentTreeItem, getPluginAssetUrl } from '@vcmap/ui';


/**
 * Login to VC Publisher   /api/v1/login
 * @param {string} url - url of DUET environment
 * @param {string} user - username of user to be logged in
 * @param {string} pw - password of the user to be logged in
 * @returns {Promise<Object<user>>} - Promise object for user containing
 * {
    "name": "string",
    "accessToken": "string",
    "pilot": "".
    etc...
    }
 */
export async function loginToDuet(url, user, pw) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({ username: user, password: pw }),
  });
  return response.json();
}

/**
 * Create VCS layer definition from DUET catalog entry
 * @param {Array<string>} layer - DUET catalog entry
 * @param {boolean} huge - boolean stating if dataset may huge => results in creation of vectortiles for geojson layer if true
 * @returns {Object} vcslayer-returns vcslayer to be added to the map
 */
export async function createLayerDefinition(layer, huge) {
  let vcsLayer;
  if (layer['odt:conformsTo'].toLowerCase() === 'cesium.terrain') {
    vcsLayer = new TerrainLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      url: layer['dcat:endpointURL'].replace('/layer.json', ''),
      properties: {
        duetType: 'terrain',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'geojson') {
    if (huge) {
      vcsLayer = new VectorTileLayer({
        name: layer['dct:identifier'],
        title: layer['dct:title'],
        properties: {
          duetType: 'vector',
          title: layer['dct:title'] || layer.title,
          featureInfo: 'genericBalloon',
          attributions: {
            provider: layer['dct:publisher'],
            url: layer['dcat:landingPage'],
            year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
          },
        },
        minLevel: 13,
        maxLevel: 21,
        tileProvider: new StaticGeoJSONTileProvider({ url: layer['dcat:endpointURL'] }),
        projection: {
          epsg: '4326',
          proj4: '+proj=longlat +datum=WGS84 +no_defs ',
        },
      });
    } else {
      vcsLayer = new GeoJSONLayer({
        name: layer['dct:identifier'],
        title: layer['dct:title'],
        properties: {
          duetType: 'vector',
          title: layer['dct:title'] || layer.title,
          featureInfo: 'genericBalloon',
          attributions: {
            provider: layer['dct:publisher'],
            url: layer['dcat:landingPage'],
            year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
          },
        },
        url: layer['dcat:endpointURL'],
        projection: {
          epsg: '4326',
          proj4: '+proj=longlat +datum=WGS84 +no_defs ',
        },
      });
    }
  } else if (layer['odt:conformsTo'].toLowerCase() === 'cesium.buildings') {
    vcsLayer = new CesiumTilesetLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      properties: {
        duetType: 'objects',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
      url: layer['dcat:endpointURL'],
      screenSpaceError: 16,
      screenSpaceErrorMobile: 32,
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'cesium.pointcloud') {
    vcsLayer = new PointCloudLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      url: layer['dcat:endpointURL'],
      properties: {
        duetType: 'pointclouds',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'wms') {
    vcsLayer = new WMSLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      url: layer['dcat:endpointURL'],
      properties: {
        duetType: 'raster',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
      parameters: layer['dcat:endpointDescription'].parameters || 'format=image/jpeg',
      version: layer['dcat:endpointDescription'].version || '1.3.0',
      maxLevel: layer['dcat:endpointDescription'].maxLevel || 18,
      layers: layer['dcat:endpointDescription'].layers || '',
      tilingSchema: layer['dcat:endpointDescription'].tilingSchema || 'Geographic',
      opacity: layer['dcat:endpointDescription'].opacity || 1,
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'tms') {
    vcsLayer = new TMSLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      url: layer['dcat:endpointURL'],
      properties: {
        duetType: 'raster',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
      format: layer['dcat:endpointDescription'].format || 'png',
      minLevel: layer['dcat:endpointDescription'].minLevel || 11,
      maxLevel: layer['dcat:endpointDescription'].maxLevel || 18,
      tileWidth: layer['dcat:endpointDescription'].tileWidth || 256,
      tileHeight: layer['dcat:endpointDescription'].tileWidth || 256,
      tilingSchema: layer['dcat:endpointDescription'].tilingSchema || 'Geographic',
      opacity: layer['dcat:endpointDescription'].opacity || 1,
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'wmts') {
    vcsLayer = new WMTSLayer({
      name: layer['dct:identifier'],
      title: layer['dct:title'],
      url: layer['dcat:endpointURL'],
      properties: {
        duetType: 'raster',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
      format: layer['dcat:endpointDescription'].format || 'image/png',
      style: layer['dcat:endpointDescription'].style || 'default',
      layer: layer['dcat:endpointDescription'].layer || '',
      tileMatrixSetID: layer['dcat:endpointDescription'].tileMatrixSetID || '',
      tileMatrixPrefix: layer['dcat:endpointDescription'].tileMatrixPrefix || '',
      maxLevel: layer['dcat:endpointDescription'].maxLevel || 19,
      tileWidth: layer['dcat:endpointDescription'].tileWidth || 256,
      tilingSchema: layer['dcat:endpointDescription'].tilingSchema || 'Geographic',
      numberOfLevelZeroTilesX: layer['dcat:endpointDescription'].numberOfLevelZeroTilesX || 1,
      numberOfLevelZeroTilesY: layer['dcat:endpointDescription'].numberOfLevelZeroTilesY || 1,
    });
  } else if (layer['odt:conformsTo'].toLowerCase() === 'vector.tiles') {
    vcsLayer = new VectorTileLayer({
      properties: {
        duetType: 'vector',
        title: layer['dct:title'] || layer.title,
        featureInfo: 'genericBalloon',
        attributions: {
          provider: layer['dct:publisher'],
          url: layer['dcat:landingPage'],
          year: layer['dct:modified'] ? new Date(layer['dct:modified']).getFullYear() : new Date(layer['dct:issued']).getFullYear(),
        },
      },
      tileProvider: new MVTTileProvider({
        url: layer['dcat:endpointURL'],
        baseLevels: [12, 13, 14, 15],
        idProperty: 'gmlid',
      }),
      extent: {
        coordinates: [-180, -90, 180, 90],
        epsg: 4326,
      },
    });
  }
  return vcsLayer;
}

/**
 * Create VCS layer definition from DUET catalog entry
 * @param {import("@vcmap/ui").VcsUiApp} app - vcsApp
 * @param {string} layer - layername setting the style for
 */
export function setStyleForLoadedLayer(app, layer) {
  const vcsLayer = app.layers.getByKey(layer);
  if (vcsLayer.className.toLowerCase().includes('vector') || vcsLayer.className.toLowerCase().includes('geojson')) {
    if (layer.toLowerCase().includes('road-network-calculation-result-flanders')) { vcsLayer.setStyle(app.styles.getByKey('TrafficFlowGenericArray')); }
    if (layer.toLowerCase().includes('noise')) { vcsLayer.setStyle(app.styles.getByKey('noiseNew')); }
    if (layer.toLowerCase().includes('noise') && layer.toLowerCase().includes('_delta')) { vcsLayer.setStyle(app.styles.getByKey('NoiseDeltaFlowGenericArray')); }
    if (layer.toLowerCase().includes('traffic')) { vcsLayer.setStyle(app.styles.getByKey('TrafficFlowGeneric')); }
    if (layer.toLowerCase().includes('traffic') && layer.toLowerCase().includes('_delta')) { vcsLayer.setStyle(app.styles.getByKey('TrafficDeltaFlowGenericArray')); }
    if (layer.toLowerCase().includes('traffic') && vcsLayer.className === 'vcs.vcm.layer.Buildings') { vcsLayer.setStyle(app.styles.getByKey('trafficFlow')); }
    if (layer.toLowerCase().includes('road-network') || layer.toLowerCase().includes('road_network')) { vcsLayer.setStyle(app.styles.getByKey('TrafficFlowGeneric')); }
    if (layer.toLowerCase().includes('road-network') && layer.toLowerCase().includes('_result')) { vcsLayer.setStyle(app.styles.getByKey('TrafficResultFlowGeneric')); }
    if (layer.toLowerCase().includes('road-network') && layer.toLowerCase().includes('_delta')) { vcsLayer.setStyle(app.styles.getByKey('TrafficDeltaFlowGenericArray')); }
    if (layer.toLowerCase().includes('cityflows')) { vcsLayer.setStyle(app.styles.getByKey('CityFlows')); }
    if (layer.toLowerCase().includes('air')) { vcsLayer.setStyle(app.styles.getByKey('airPollution3D')); }
    if (layer.toLowerCase().includes('telraam')) { vcsLayer.setStyle(app.styles.getByKey('TrafficFlowGeneric_old')); }
    if (layer.toLowerCase().includes('sensor')) { vcsLayer.setStyle(app.styles.getByKey('Sensors')); }
    if (layer.toLowerCase().includes('chmirt')) { vcsLayer.setStyle(app.styles.getByKey('Sensors')); }
    if (layer.toLowerCase().includes('openaq')) { vcsLayer.setStyle(app.styles.getByKey('OpenAQ')); }
    if (layer.toLowerCase().includes('latest_aq')) { vcsLayer.setStyle(app.styles.getByKey('Sensors')); }
  }
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 */
export function activateDuetLayers(app) {
  const layers = Array.from(app.layers).filter(el => (Object.hasOwn(el.properties, 'duetType'))).map(el => el.name);
  layers.forEach((l) => {
    const layer = app.layers.getByKey(l);
    if (layer && !layer.name.includes('roadClosures') && !layer.name.includes('_delta') && (layer.className === 'VectorTileLayer' || layer.className === 'WMTSLayer')) {
      layer.deactivate();
    } else if (!layer.active) {
      layer.activate();
    }
  });
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {string} layerName - name of layer to apply the sytle for
 * @param {string} styleName - name of style to be applied
 */
export function setUsedStyleForDuetLayer(app, layerName, styleName) {
  const vcsLayer = app.layers.getByKey(layerName);
  if (vcsLayer) {
    vcsLayer.setStyle(app.styles.getByKey(styleName));
  }
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 * @param {import("@vcmap/core").Layer} layer - the layer definition of the layer added to the api and added to the content tree
 */
export function addContentTreeEntry(app, layer) {
  const newItem = new LayerContentTreeItem({
    name: `${layer.properties.duetType }.${ layer.name}`,
    layerName: layer.name,
  }, app);
  app.contentTree.add(newItem);
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 * @param {string} name - name of node to be added to the content tree
 * @param {string} title - title of the node to be shown in the content tree
 */
export function addNodeContentTreeEntry(app, name, title) {
  const newItem = new NodeContentTreeItem({
    type: 'NodeContentTreeItem',
    name,
    title,
    initOpen: true,
  }, app);
  app.contentTree.add(newItem);
}

/**
 * Create VCS geojson layer from experiments feature collection
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 * @param {Object} experiment - experiment object from DUET
 */
export async function createBlockageLayer(app, experiment) {
  const layer = new GeoJSONLayer({
    name: `roadClosures-${experiment._id}`,
    projection: {
      epsg: 4326,
    },
    vectorProperties: {
      classificationType: 'both',
    },
    style: {
      type: 'VectorStyleItem',
      image: {
        scale: 1,
        src: getPluginAssetUrl(app, 'duetviewer', '/plugin-assets/icons/stop.png'),
      },
    },
  });
  await layer.activate();
  layer.properties = { duetType: 'simresults', title: `road closures for ${ experiment.title}` };
  const features = parseGeoJSON(experiment.features);
  layer.addFeatures(features.features);
  app.layers.add(layer);
  const newItem = new LayerContentTreeItem({
    name: `${layer.properties.duetType }.${ layer.name}`,
    layerName: layer.name,
  }, app);
  app.contentTree.add(newItem);
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 */
export function removeContentTreeItems(app) {
  const items = Array.from(app.contentTree).filter(el => el.name.includes('simresults.')).map(el => el.name);
  const legends = Array.from(app.contentTree);
  items.forEach((item) => {
    app.contentTree.remove(legends.find(el => el.name === item));
  });
}


/**
 * removes all DUET layers from map
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 * @param {string} type - either empty or 'simresults'
 */
export function removeDuetLayers(app, type = '') {
  const layers = Array.from(app.layers).filter((el) => {
    if (Object.hasOwn(el.properties, 'duetType')) {
      if (!type && el.properties.duetType.toLowerCase().includes(type)) {
        return el;
      } else {
        return el;
      }
    }
    return false;
  }).map(el => el.name);

  const legends = Array.from(app.contentTree);
  layers.forEach((layer) => {
    const vcsLayer = app.layers.getByKey(layer);
    if (vcsLayer) {
      app.layers.remove(vcsLayer);
      app.contentTree.remove(legends.find(el => el.name === `${vcsLayer.properties.duetType }.${ vcsLayer.name}`));
      vcsLayer.destroy();
    }
  });
}

/**
 * @param {Object} elm - base element to be inspected
 * @param {number} length - length of Array
 * @returns {Object} newElm - returned object
 */
function makeOldValueEqualToNew(elm, length) {
  if (Array.isArray(elm)) {
    if (elm.length === length) {
      return elm;
    } else if (elm.length < length) {
      const newElm = Array.fill(elm[elm.length], elm.length, length - elm.length);
      return newElm;
    } else {
      const newElm = elm.slice(1, length);
      return newElm;
    }
  } else {
    // Assumption elm is not an object
    const newElm = new Array(length).fill(elm);
    return newElm;
  }
}

/**
 * @param {Object} oldProps  - old properties object
 * @param {Object} newProps - new properties object
 * @returns {Promise<Object>} - Promise with diff object
 */
async function calcDiffForEntries(oldProps, newProps) {
  const result = {};
  const diffPerc = (oldArray, newArray) => oldArray.map((num, idx) => {
    let val = 0;
    // if(Math.abs(newArray[idx])>0 && Math.abs(num)>0) val = Math.floor(((newArray[idx]-num)/num)*100);
    // val=Reference-new
    /*             How to Calculate Percentage Increase:
          - Subtract final value minus starting value
          - Divide that amount by the absolute value of the starting value
          - Multiply by 100 to get percent increase
      If the percentage is negative, it means there was a decrease and not an increase. */

    val = newArray[idx] - num;
    return val;
  });
  if (Object.hasOwn(oldProps, 'Traffic') || Object.hasOwn(oldProps, 'traffic')) {
    delete Object.assign(oldProps, { flow: oldProps.Traffic }).Traffic;
    delete Object.assign(oldProps, { flow: oldProps.traffic }).traffic;
  }
  if (Object.hasOwn(newProps, 'Traffic') || Object.hasOwn(newProps, 'traffic')) {
    delete Object.assign(newProps, { flow: newProps.Traffic }).Traffic;
    delete Object.assign(newProps, { flow: newProps.traffic }).traffic;
  }
  if (Object.hasOwn(oldProps, 'laeq')) {
    delete Object.assign(oldProps, { noise: oldProps.laeq }).laeq;
  }
  if (Object.hasOwn(newProps, 'laeq')) {
    delete Object.assign(newProps, { noise: newProps.laeq }).laeq;
  }
  if (Object.hasOwn(oldProps, 'leq')) {
    delete Object.assign(oldProps, { noise: oldProps.laeq }).leq;
  }
  if (Object.hasOwn(newProps, 'leq')) {
    delete Object.assign(newProps, { noise: newProps.laeq }).leq;
  }
  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);
  let intersection = newKeys.filter(x => oldKeys.includes(x));
  intersection = intersection.filter(x => !x.includes('id'));
  if (intersection.length > 0) {
    return Promise.all(intersection.map(async (el) => {
      const oldValue = oldProps[el];
      const newValue = newProps[el];
      if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        const diff = diffPerc(oldValue, newValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else if (Array.isArray(newValue)) {
        const equal = makeOldValueEqualToNew(oldValue, newValue.length);
        const diff = diffPerc(equal, newValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else if (Array.isArray(oldValue)) {
        const equal = makeOldValueEqualToNew(newValue, oldValue.length);
        const diff = diffPerc(equal, oldValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else {
        const diff = diffPerc([oldValue], [newValue]);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      }
    })).then(() => {
      return Promise.resolve(result);
    });
  } else {
    intersection = newKeys.filter(x => !x.includes('id'));
    return Promise.all(intersection.map(async (el) => {
      const oldValue = 0;
      const newValue = newProps[el];
      if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        const diff = diffPerc(oldValue, newValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else if (Array.isArray(newValue)) {
        const equal = makeOldValueEqualToNew(oldValue, newValue.length);
        const diff = diffPerc(equal, newValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else if (Array.isArray(oldValue)) {
        const equal = makeOldValueEqualToNew(newValue, oldValue.length);
        const diff = diffPerc(equal, oldValue);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      } else {
        const diff = diffPerc([oldValue], [newValue]);
        result[`${el}_delta`] = diff;
        Promise.resolve(true);
      }
    })).then(() => {
      return Promise.resolve(result);
    });
  }
}

/**
 * Create delta layer for sim results
 * @param {Object} app - vcsApp
 * @param {Object} base - base VCS layer
 * @param {Object} hash - result data of simulation
 * @returns {Object} vcslayer-returns vcslayer delta layer to be added to the map
 */
export async function createDeltaLayer(app, base, hash) {
  const config = base.toJSON();
  const { url } = config.tileProvider;
  delete config.type;
  delete config.style;
  config.tileProvider = new StaticGeoJSONTileProvider({ url });
  const vcsLayer = new VectorTileLayer(config);
  vcsLayer.name = vcsLayer.name.replace('reference', 'delta');
  vcsLayer.properties.title = vcsLayer.properties.title.replace('reference', 'delta');
  app.layers.add(vcsLayer);
  const results = hash;
  await vcsLayer.activate();
  const tileprovider = vcsLayer.tileProvider;
  tileprovider.tileLoadedEvent.addEventListener((item) => {
    const features = item.rtree.all();
    return Promise.all(features.map(async (f) => {
      const properties = f.value.getProperties();
      let id = f.value.getProperty('id');
      if (vcsLayer.name.toLowerCase().includes('road-network-calculation-result-flanders')) id = f.value.getProperty('link_id');
      if (vcsLayer.name.toLowerCase().includes('kul-gent-traffic-results')) id = f.value.getProperty('link_id');
      if (vcsLayer.name.toLowerCase().includes('road-network-calculation-result-pilsen')) id = f.value.getProperty('edge_id');
      if (vcsLayer.name.toLowerCase().includes('road-network-calculation-result-athens')) id = f.value.getProperty('edge_id');
      const change = results[id];
      if (change) {
        const result = await calcDiffForEntries(properties, change);
        f.value.setProperties(result, true);
      }
    })).then(() => {
      vcsLayer.updateTiles(['0/0/0']);
    });
  });

  return Promise.resolve(vcsLayer);
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - vcs app
 * @param {Object} body - object to be posted
 * @returns {Promise}
 */
export async function tnoPayloadPublisher(app, body) {
  const plugin = app.plugins.getByKey('duetviewer');
  const { config } = plugin;
  const url = config.appReceiverURL;
  // let url = '/nodeTopic/';
  // Post Message to DUET service
  // const response = await fetch(url+'publish',{
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await response;
  if (response.ok) {
    return Promise.resolve('true');
  } else {
    return Promise.resolve('false');
  }
  // return axios.post(url+'publish',body, {headers: {'content-type': 'application/json'}});
}
