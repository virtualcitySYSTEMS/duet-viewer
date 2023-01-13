import * as turf from '@turf/turf';
import { DeclarativeStyleItem, StaticGeoJSONTileProvider, VectorTileLayer, Viewpoint, WMTSLayer } from '@vcmap/core';
import {
  activateDuetLayers, addContentTreeEntry, addNodeContentTreeEntry, createDeltaLayer,
  // eslint-disable-next-line max-len
  createLayerDefinition, setStyleForLoadedLayer, tnoPayloadPublisher,
} from './duetAPI.js';
import dueterror from './errorlogging.js';
import lineOffsetter from './lineOffsetter.js';

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {number} x - x coordinate of case / scenario
 * @param {number} y - coordinate of case / scenario
 * @param {Object} config - configuration object of case or scenario
 */
export async function viewpointLoader(app, x, y, config = {}) {
  let json;
  const plugin = app.plugins.getByKey('duetviewer');
  if (config || (x && y)) {
    if (config === '' || !config) {
      json = {};
    } else {
      json = JSON.parse(config);
    }
    if (Object.keys(json).length !== 0) {
      const vp = new Viewpoint(json);
      const pt = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: vp.cameraPosition || vp.groundPosition,
        },
      };
      const region = turf.buffer(pt, 20, {
        units: 'kilometers',
      });
      plugin.state.region.value = turf.bbox(region);
      await app.maps.activeMap.gotoViewpoint(vp);
    } else if (!Number.isNaN(x) && !Number.isNaN(y)) {
      const vp = await app.maps.activeMap?.getViewpoint();
      if (vp) {
        delete vp.cameraPosition;
        vp.groundPosition = [Number(x), Number(y), 0];
        vp.distance = 400;
        vp.animate = true;
        const pt = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: vp.cameraPosition || vp.groundPosition,
          },
        };
        const region = turf.buffer(pt, 20, {
          units: 'kilometers',
        });
        plugin.state.region.value = turf.bbox(region);
        await app.maps.activeMap.gotoViewpoint(vp);
      }
    } else {
      plugin.state.region.value = [-16.551070887660167, 33.71204131312285, 37.151568857997155, 58.620157267889056];
      dueterror.addError({ function: 'viewpointLoader() in loaders', message: `Issue fetching viewpoint from case: \n${ config}` }, 3);
    }
  } else {
    // console.log('cannot go to viewpoint, please check the case config...')
    dueterror.addError({ function: 'viewpointLoader() in loaders', message: `Issue fetching viewpoint from case: \n${ config}` }, 3);
  }
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {Object} config - style configuration object of case or scenario
 * @returns {Promise}
 */
export async function styleLoader(app, config = {}) {
  const promises = await Promise.all(Object.keys(config).map(async (key) => {
    const style = config[key];
    delete style.type;
    const newItem = new DeclarativeStyleItem(style);
    app.styles.add(newItem);
  }));
  return promises;
}

/**
 * delays for given milliseconds
 * @param {number} milliseconds
 * @returns {Promise}
 */
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * creates WMTS layer for tno sim results
 * @param {string} key - url key property
 * @param {string} url - url to tno service
 * @param {string} id - id of simulation scenario
 * @param {Array<number>} bbox - array of 4 number defining the [minx,miny,maxx,maxy] extent of WMTS region
 * @param {string} type - type of simulation (air, noise)
 * @returns {import("@vcmap/core").Layer} WMTS layer
 */
async function createTnoWMTS(key, url, id, bbox, type) {
  let name = `${type}-pollution-tno-${id}`;
  let title;
  if (key.includes('delta')) {
    name += '_delta';
    title = `TNO ${type} pollution delta`;
  }
  if (key.includes('reference')) {
    name += '_reference';
    title = `TNO ${type} pollution reference`;
  }
  if (key.includes('tiles')) {
    name += '_result';
    title = `TNO  ${type} pollution result`;
  }
  const vcsLayer = new WMTSLayer({
    name,
    title,
    url: url.replace('{z}/{x}/{y}.png', '{TileMatrix}/{TileCol}/{TileRow}.png'),
    properties: {
      duetType: `simresults.${type}`,
      title,
      attributions: {
        provider: 'TNO',
        url: 'https://www.tno.nl/en/digital/smart-traffic-transport/societal-impact/healthy-city-accessible-safe-vital/',
        year: '2022',
      },
    },
    format: 'image/png',
    maxLevel: 19,
    tileSize: [256, 256],
    tilingSchema: 'mercator',
    extent: {
      coordinates: bbox,
      projection: {
        epsg: '4326',
      },
    },
    opacity: 0.5,
  });
  await vcsLayer.activate();
  return vcsLayer;
}

/**
 *
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {Object} object - payload object of tno sim result service
 * @param {string} type - type of simulation (air, noise)
 * @returns {Promise} promise
 */
export async function tnoModelResultLoader(app, object, type) {
  const plugin = app.plugins.getByKey('duetviewer');
  const tileKeys = Object.keys(object).filter(el => el.includes('url'));
  addNodeContentTreeEntry(app, `simresults.${ type}`, `${type } results for ${ object.scenarioid}`);
  if (tileKeys.length !== 0) {
    await Promise.all(tileKeys.map(async (key) => {
      const layer = await createTnoWMTS(key, object[key], object.scenarioid, plugin.state.region.value, type);
      app.layers.add(layer);
      addContentTreeEntry(app, layer);
    }));
    activateDuetLayers(app);
    return Promise.resolve('true');
    // add WMTS layers
  } else {
    dueterror.addError({ function: 'tnoModelResultLoader() in loaders', message: `layers from TNO model results could not be created. Please inspect experiment definition:${ JSON.stringify(object)}` }, 3);
    return Promise.resolve('true');
  }
}

/**
 * creates WMTS layer for vito sim results
 * @param {string} key - url key property
 * @param {string} url - url to tno service
 * @param {string} id - id of simulation scenario
 * @param {Array<number>} bbox - array of 4 number defining the [minx,miny,maxx,maxy] extent of WMTS region
 * @param {string} type - type of simulation (air, noise)
 * @returns {import("@vcmap/core").Layer} WMTS layer
 */
async function createVitoWMTS(key, url, id, bbox, type) {
  let name = `${type}-pollution-vito-${id}`;
  let title;
  if (key.includes('delta')) {
    name += '_delta';
    title = `VITO ${type} pollution delta`;
  }
  if (key.includes('reference')) {
    name += '_reference';
    title = `VITO ${type} pollution reference`;
  }
  if (key.includes('tiles')) {
    name += '_result';
    title = `VITO  ${type} pollution result`;
  }
  const vcsLayer = new WMTSLayer({
    name,
    title,
    url: url.replace('{z}/{x}/{y}', '{TileMatrix}/{TileCol}/{TileRow}'),
    properties: {
      duetType: 'simresults',
      title,
      attributions: {
        provider: 'VITO',
        url: 'https://vito.be/en/atmo-street',
        year: '2022',
      },
    },
    format: 'image/png',
    maxLevel: 19,
    tileSize: [256, 256],
    tilingSchema: 'geographic',
    extent: {
      coordinates: bbox,
      projection: {
        epsg: '4326',
      },
    },
    opacity: 0.5,
  });
  await vcsLayer.activate();
  return vcsLayer;
}

/**
 *
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {Object} object - object of vito pollutant
 * @param {string} type - type of simulation (type=air)
 * @param {string} scenarioid - id of simulation scenario
 * @returns {Promise} promise
 */
async function vitoModelPollutantResultLoader(app, object, type, scenarioid) {
  const plugin = app.plugins.getByKey('duetviewer');
  const tileKeys = Object.keys(object).filter(el => el.includes('url'));
  addNodeContentTreeEntry(app, `simresults.${ type}`, `${type } results for ${ scenarioid}`);
  if (tileKeys.length !== 0) {
    await Promise.all(tileKeys.map(async (key) => {
      const layer = await createVitoWMTS(key, object[key], scenarioid, plugin.state.region.value, type);
      app.layers.add(layer);
      addContentTreeEntry(app, layer);
    }));
    activateDuetLayers(app);
    return Promise.resolve('true');
    // add WMTS layers
  } else {
    dueterror.addError({ function: 'tnoModelResultLoader() in loaders', message: `layers from TNO model results could not be created. Please inspect experiment definition:${ JSON.stringify(object)}` }, 3);
    return Promise.resolve('true');
  }
}

/**
 * creates WMTS layer for each pollutant of vito siulation results
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {Object} object - payload object of vito sim result service
 * @param {string} type - type of simulation (type=air)
 * @returns {Promise}  promise
 */
export async function vitoModelResultLoader(app, object, type) {
  addNodeContentTreeEntry(app, 'simresults.air', `air pollution results for ${ object.scenarioid}`);
  return Promise.all(object.pollutants.map(async (pol) => {
    return vitoModelPollutantResultLoader(app, object[pol], `${type }.${ pol.replace('.', '_')}`, object.scenarioid);
  }));
}

/**
 * creates layer for simulation results
 * @param {string} url - url to fetch data from
 * @param {string} name - name of layer
 * @param {string} type - type of simulation (type=traffic, noise)
 * @returns {import("@vcmap/core").Layer} VectorTiles layer
 */
function addBaselayer(url, name, type) {
  const vcsLayer = new VectorTileLayer({
    name,
    title: `${type } ${ name.split('_')[1]}`,
    properties: {
      duetType: `simresults.${type}`,
      title: `${type } ${ name.split('_')[1]}`,
      featureInfo: 'genericBalloon',
      attributions: {
        provider: 'Duet',
        url: 'Duet',
        year: new Date().getFullYear(),
      },
    },
    minLevel: 13,
    maxLevel: 21,
    tileProvider: new StaticGeoJSONTileProvider({ url }),
  });
  return vcsLayer;
}

/**
 *
 * @param {Object} hash - object of objects (id of feature) containing the simulation results provided by sim result message
 * @param {string} name - name of the layer
 * @param {import("@vcmap/core").Layer} layer - VectorTiles Layer to apply the sim results to
 * @returns {import("@vcmap/core").Layer}
 */
async function createResultlayer(hash, name, layer) {
  return layer.activate().then(() => {
    const tileprovider = layer.tileProvider;
    tileprovider.tileLoadedEvent.addEventListener((item) => {
      const features = item.rtree.all();
      return Promise.all(features.map(async (f) => {
        let id = f.value.getProperty('id');
        if (name.toLowerCase().includes('road-network-calculation-result-flanders')) id = f.value.getProperty('link_id');
        if (name.toLowerCase().includes('kul-gent-traffic-results')) id = f.value.getProperty('link_id');
        if (name.toLowerCase().includes('road-network-calculation-result-pilsen')) id = f.value.getProperty('edge_id');
        if (name.toLowerCase().includes('road-network-calculation-result-athens')) id = f.value.getProperty('edge_id');
        f.value.setProperties(hash[id], true);
      })).then(() => {
        layer.updateTiles(['0/0/0']);
        return Promise.resolve(layer);
      });
    });
    return layer;
  });
}

/**
 * creates an object of objects with id of feature as key and sim results as value
 * @param {Array<Objects>} changes - array of sim results
 * @returns {Object} Object
 */
async function createHashMap(changes) {
  const testFeature = changes[0];
  const idKey = Object.keys(testFeature).find(key => (key.toLowerCase().includes('id') && !key.toLowerCase().includes('to_node_id') && !key.toLowerCase().includes('from_node_id')));
  const hash = {};
  await Promise.all(changes.map(async (s) => {
    s.id = s[idKey];
    if (s.laeq) delete Object.assign(s, { noise: s.laeq }).laeq;
    if (s.LAEQ) delete Object.assign(s, { noise: s.LAEQ }).LAEQ;
    hash[s.id] = s;
  }));
  return Promise.resolve(hash);
}

/**
 * loads all layers from a list of used datasources defined in a case or scenario
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {string} url - url to Duet catalog service
 * @param {string} token - security token fetched from DUET login
 * @param {Array<string>} layers - array of strings naming the datasource identifiers of DUET catalog to be loaded
 * @returns {Array<promises>} - promise is either string or VCS layer
 */
export async function layerLoader(app, url, token, layers = []) {
  let source;
  if (layers.length !== 0) {
    if (layers.length === 1 && layers[0] === '') {
      dueterror.addError({ function: 'layerLoader() in loaders', message: 'Sorry but there are no layers to load defined in that case..' }, 2);
      return Promise.resolve('true');
    } else {
      const addedLayers = await Promise.all(
        layers.map(async (l) => {
          if (l !== '') {
            let datasourceToFetch = l;
            if (!datasourceToFetch.includes('terrain')) {
              datasourceToFetch += '_pbr';
            }
            const response = await fetch(`${url }datasources/${datasourceToFetch.toLowerCase().split(' ').join('_')}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).catch((e) => {
              // eslint-disable-next-line no-console
              console.log(JSON.stringify(e));
            });
            source = await response.json();
            if (!Object.hasOwn(source, 'error')) {
              let huge = false;
              if (source['dct:identifier'].toLowerCase().includes('traffic') || source['dct:identifier'].toLowerCase().includes('road') || source['dct:identifier'].toLowerCase().includes('noise')) {
                huge = true;
              }
              const layer = await createLayerDefinition(source, huge);
              app.layers.add(layer);
              await layer.activate();
              if ((layer.className === 'VectorTileLayer' || layer.className === 'GeoJSONLayer') && (layer.name.toLowerCase().includes('flanders') || layer.name.toLowerCase().includes('traffic_links_antwerp') || layer.name.toLowerCase().includes('gent_road_network') || layer.name.toLowerCase().includes('gent') || layer.name.toLowerCase().includes('kul'))) {
                layer.activate().then(async () => {
                  const tileprovider = layer.tileProvider;
                  await delay(100);
                  if (tileprovider) {
                    tileprovider.tileLoadedEvent.addEventListener((item) => {
                      const features = item.rtree.all();
                      lineOffsetter(features).then(() => {
                        layer.updateTiles(['0/0/0']);
                        setStyleForLoadedLayer(app, layer.name);
                      });
                    });
                  }
                });
              }
              addContentTreeEntry(app, layer);
              setStyleForLoadedLayer(app, layer.name);
              return Promise.resolve(layer);
            } else {
              const resp = await fetch(`${url }datasources/${l.toLowerCase().split(' ').join('_')}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).catch((e) => {
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(e));
              });
              source = await resp.json();
              let huge = false;
              if (source['dct:identifier'].toLowerCase().includes('traffic') || source['dct:identifier'].toLowerCase().includes('road') || source['dct:identifier'].toLowerCase().includes('noise')) {
                huge = true;
              }
              const layer = await createLayerDefinition(source, huge);
              app.layers.add(layer);
              if ((layer.className === 'VectorTileLayer' || layer.className === 'GeoJSONLayer') && (layer.name.toLowerCase().includes('flanders') || layer.name.toLowerCase().includes('traffic_links_antwerp') || layer.name.toLowerCase().includes('gent_road_network') || layer.name.toLowerCase().includes('gent') || layer.name.toLowerCase().includes('kul'))) {
                layer.activate().then(async () => {
                  const tileprovider = layer.tileProvider;
                  await delay(100);
                  if (tileprovider) {
                    tileprovider.tileLoadedEvent.addEventListener((item) => {
                      const features = item.rtree.all();
                      lineOffsetter(features).then(() => {
                        layer.updateTiles(['0/0/0']);
                        setStyleForLoadedLayer(app, layer.name);
                      });
                    });
                  }
                });
              }
              addContentTreeEntry(app, layer);
              setStyleForLoadedLayer(app, layer.name);
              return Promise.resolve(layer);
            }
          } else {
            return Promise.resolve('true');
          }
        }),
      );
      if (addedLayers) {
        dueterror.addError({ function: 'layerLoader() in loaders', message: 'All layers of case are loaded' }, 1);
      }
      return Promise.resolve('true');
    }
  } else {
    dueterror.addError({ function: 'layerLoader() in loaders', message: 'Sorry but there are no layers to load defined in that case..' }, 2);
    return Promise.resolve('true');
  }
}

/**
 * Fetches all models from an experiment
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {Array<objects>} models - array of models
 * @param {string} title - title of experiment to be loaded
 * @returns {Array<promises>} - returns an array of promises
 */
export async function modelResultLoader(app, models, title) {
  const plugin = app.plugins.getByKey('duetviewer');
  const { config } = plugin;
  const { referenceData } = config;
  const referenceDataKeys = Object.keys(referenceData);
  const token = plugin.state.credentials.value.accessToken;
  const promises = await Promise.all(models.map(async (model) => {
    const layername = model.name.replace('.', ',');
    const { type } = model;
    if (Object.hasOwn(model, 'url')) {
      const response = await fetch(model.url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(e));
        dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Experiment could not be fetched... please check experiment results at:${ model.url}` }, 3);
      });
      const result = await response.json();
      let data;
      if (Array.isArray(result.data)) {
        data = result.data[0];
      } else {
        // eslint-disable-next-line prefer-destructuring
        data = result.data;
      }
      if (typeof data === 'object') {
        if (data.metadata.status === 'ok') {
          dueterror.addError({ function: 'modelResultLoader() in loaders', message: 'Experiment results will be loaded... please be patient!' }, 1);
          addNodeContentTreeEntry(app, `simresults.${ type}`, `${type } results for ${ title}`);
          if (Object.hasOwn(data.metadata, 'road_network_geom_url') || Object.hasOwn(data.metadata, 'receiver_geom_url')) {
            let url = data.metadata.road_network_geom_url || data.metadata.receiver_geom_url;
            if (referenceDataKeys.length !== 0) {
              referenceDataKeys.forEach((key) => {
                if (layername.includes(key)) {
                  url = referenceData[key];
                }
              });
            }
            const layer = addBaselayer(url, `${layername }_reference`, type);
            const resultLayer = addBaselayer(url, `${layername }_result`, type);

            // Add reference layer to app and set Content tree entry and style layer
            app.layers.add(layer);
            await layer.activate();
            if ((layer.className === 'VectorTileLayer' || layer.className === 'GeoJSONLayer') && (layer.name.toLowerCase().includes('flanders') || layer.name.toLowerCase().includes('traffic_links_antwerp') || layer.name.toLowerCase().includes('gent_road_network') || layer.name.toLowerCase().includes('gent') || layer.name.toLowerCase().includes('kul'))) {
              layer.activate().then(async () => {
                const tileprovider = layer.tileProvider;
                await delay(100);
                if (tileprovider) {
                  tileprovider.tileLoadedEvent.addEventListener((item) => {
                    const features = item.rtree.all();
                    lineOffsetter(features).then(() => {
                      layer.updateTiles(['0/0/0']);
                      setStyleForLoadedLayer(app, layer.name);
                    });
                  });
                }
              });
            }
            addContentTreeEntry(app, layer);
            setStyleForLoadedLayer(app, layer.name);
            // Add result layer to app and set Content tree entry and style layer
            app.layers.add(resultLayer);
            await resultLayer.activate();
            if ((resultLayer.className === 'VectorTileLayer' || resultLayer.className === 'GeoJSONLayer') && (resultLayer.name.toLowerCase().includes('flanders') || resultLayer.name.toLowerCase().includes('traffic_links_antwerp') || resultLayer.name.toLowerCase().includes('gent_road_network') || resultLayer.name.toLowerCase().includes('gent') || resultLayer.name.toLowerCase().includes('kul'))) {
              resultLayer.activate().then(async () => {
                const tileprovider = resultLayer.tileProvider;
                await delay(100);
                if (tileprovider) {
                  tileprovider.tileLoadedEvent.addEventListener((item) => {
                    const features = item.rtree.all();
                    lineOffsetter(features).then(() => {
                      resultLayer.updateTiles(['0/0/0']);
                      setStyleForLoadedLayer(app, resultLayer.name);
                    });
                  });
                }
              });
            }
            const hash = await createHashMap(data.result);
            const resultingLayer = await createResultlayer(hash, layername, resultLayer);
            addContentTreeEntry(app, resultingLayer);
            setStyleForLoadedLayer(app, resultingLayer.name);

            const deltaLayer = await createDeltaLayer(app, layer, hash);
            if ((deltaLayer.className === 'VectorTileLayer' || deltaLayer.className === 'GeoJSONLayer') && (deltaLayer.name.toLowerCase().includes('flanders') || deltaLayer.name.toLowerCase().includes('traffic_links_antwerp') || deltaLayer.name.toLowerCase().includes('gent_road_network') || deltaLayer.name.toLowerCase().includes('gent') || deltaLayer.name.toLowerCase().includes('kul'))) {
              deltaLayer.activate().then(async () => {
                const tileprovider = deltaLayer.tileProvider;
                await delay(100);
                if (tileprovider) {
                  tileprovider.tileLoadedEvent.addEventListener((item) => {
                    const features = item.rtree.all();
                    lineOffsetter(features).then(() => {
                      deltaLayer.updateTiles(['0/0/0']);
                      setStyleForLoadedLayer(app, deltaLayer.name);
                    });
                  });
                }
              });
            }
            addContentTreeEntry(app, deltaLayer);
            setStyleForLoadedLayer(app, deltaLayer.name);
          }
        } else {
          dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Experiment results could not be loaded... please check experiment results at:${ model.url}` }, 3);
        }
      } else {
        dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Experiment results could not be loaded... please check experiment results at:${ model.url}` }, 3);
      }
      return Promise.resolve('true');
    } else if (Object.hasOwn(model, 'payload')) {
      // eslint-disable-next-line no-console
      console.log('TNO model result loading needs to be implemented');
      const response = await fetch(model.payload).catch((e) => {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(e));
        dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Payload could not be fetched... please check experiment results at:${ model.payload}` }, 3);
      });
      const result = await response.json();
      if (Object.hasOwn(result, 'data')) {
        const { data } = result;
        if (Object.hasOwn(data, 'payload') && Object.hasOwn(data, 'clientID') && Object.hasOwn(data, 'topic')) {
          // eslint-disable-next-line no-console
          console.log('new TNO result to be loaded via message broker');
          const resp = await tnoPayloadPublisher(app, data);
          if (resp === 'true') {
            plugin.state.scenarioIds.value.push(data.payload.scenarioid);
          } else {
            dueterror.addError({ function: 'tnoPayloadPublisher() in duetAPI', message: `Publish message to DUET message broker failed!:${ JSON.stringify(data)}` }, 3);
          }
        } else if (Object.hasOwn(data, 'scenarioid') && Object.hasOwn(data, 'tilesurl')) {
          // eslint-disable-next-line no-console
          console.log('OLD TNO result!! Will not work to load...');
          dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Payload is of temporaray TNO format and cannot be loaded, since it is gone after 30 minutes!:${ JSON.stringify(data)}` }, 3);
        } else if (Object.hasOwn(data, 'scenarioid') && Object.hasOwn(data, 'pollutants')) {
          // eslint-disable-next-line no-console
          console.log('VITO result... will work to load...');
          dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Fetching VITO model results... be patient!:${ JSON.stringify(data)}` }, 1);
          const resp = vitoModelResultLoader(app, data, 'air');
          if (resp === 'true') {
            plugin.state.scenarioIds.value.push(data.payload.scenarioid);
          } else {
            dueterror.addError({ function: 'tnoPayloadPublisher() in duetAPI', message: `Publish message to DUET message broker failed!:${ JSON.stringify(data)}` }, 3);
          }
        } else {
          dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Payload is of unknown format:${ JSON.stringify(data)}` }, 3);
        }
      } else {
        dueterror.addError({ function: 'modelResultLoader() in loaders', message: `Payload is of unknown format:${ JSON.stringify(result)}` }, 3);
        return Promise.resolve('true');
      }
      return Promise.resolve('true');
    }
    return Promise.resolve('true');
  }));
  activateDuetLayers(app);
  return promises;
}
