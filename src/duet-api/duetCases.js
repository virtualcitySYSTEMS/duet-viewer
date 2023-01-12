import { viewpointLoader, layerLoader, styleLoader } from './loaders.js';
import { removeDuetLayers, setUsedStyleForDuetLayer } from './duetAPI.js';
import { initialize } from './kafkaConnector.js';

/**
 * @typedef {Object} cases
 * @property {Array.<Object>} cases - the returned cases from cases manager
 * @property {number} pageIndex - the index of the returned page
 * @property {number} pageSize - the number of returned cases per page
 * @property {number} totalPages - the number of total pages for this pageSize
 */


/**
 * Fetches all cases from DUET's case manager
 * @param {string} url - url of DUET's cases manager
 * @param {number} index - pageindex to be requested
 * @returns {Promise<cases>} - returns object of cases, pageIndex, pageSize, totalPages
 */
export async function getCasesFromManager(url, index) {
  const pageSize = 8;
  const pageIndex = index;
  const requestURL = `${url}cases?pageIndex=${pageIndex}&pageSize=${pageSize}&sortBy=updated&sortOrder=desc`;
  const response = await fetch(requestURL).catch((e) => {
    return e;
  });
  const allCases = await response.json();
  const pages = allCases.totalPages;
  const promises = allCases.cases.map(async ({ id }) => {
    const resp = await fetch(`${url }cases/case-details-lite?caseID=${id}`).catch((e) => {
      return e;
    });
    const caseI = await resp.json();
    return caseI;
  });
  const newCases = await Promise.all(promises);
  allCases.cases = newCases;
  return { allCases: allCases.cases, pageIndex, pageSize, totalPages: pages };
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {*} config
 * @param {*} caseConfig
 * @param {*} token
 */
export async function loadCase(app, config, caseConfig, token) {
  // Remove existing DUET layers and legend entries
  removeDuetLayers(app);
  // load viewpoint from case config
  viewpointLoader(app, caseConfig.x_coordinate, caseConfig.y_coordinate, caseConfig.userViewpoint);

  const plugin = app.plugins.getByKey('duetviewer');
  plugin.state.pilot.value = caseConfig.pilot;
  initialize(app, plugin.state.pilot.value);
  // load layers from case config
  if (caseConfig.caseDatasources.length !== 0) {
    await layerLoader(app, config.duetCatalogURL, token, caseConfig.caseDatasources[0].split(','));
  } else if (caseConfig.usedDatasets !== '') {
    const datasources = caseConfig.usedDatasets.split(',');
    await layerLoader(app, config.duetCatalogURL, token, datasources);
  }

  // load user styles from case config
  if (caseConfig.userStyles !== '') {
    await styleLoader(app, JSON.parse(caseConfig.userStyles));
  }

  // apply styles from config to layers
  if (caseConfig.usedStyles !== '') {
    const usedStyles = JSON.parse(caseConfig.usedStyles);
    await Promise.all(Object.keys(usedStyles).map(async (key) => {
      usedStyles[key].forEach((layer) => {
        setUsedStyleForDuetLayer(app, layer, key);
      });
    }));
  }

  // activate layers as defined in case config and deactivate all others loaded from config
  if (caseConfig.activeLayers.length !== 0) {
    const layersToActivate = caseConfig.activeLayers;
    const layers = Array.from(app.layers).filter(el => (Object.hasOwn(el.properties, 'duetType'))).map(el => el.name);
    layers.forEach((l) => {
      const layer = app.layers.getByKey(l);
      if (layer && !layer.name.includes('roadClosures')) {
        layer.deactivate();
      }
    });
    layersToActivate.forEach((l) => {
      let layer = app.layers.getByKey(l);
      if (layer && !layer.name.includes('roadClosures')) {
        layer.activate();
      } else {
        layer = app.layers.getByKey(`${l}_pbr`);
        if (layer && !layer.name.includes('roadClosures')) {
          layer.activate();
        }
      }
    });
  }
}

