import { removeContentTreeItems, removeDuetLayers, setUsedStyleForDuetLayer } from './duetAPI.js';
import { getAllExperimentsForScenario, loadExperiment } from './duetExperiment.js';
import dueterror from './errorlogging.js';
import { layerLoader, styleLoader, viewpointLoader } from './loaders.js';

/**
 * @param {string} url - url to DUET scenario service 
 * @param {number} id - integer id of case to fetch the scenarios for
 * @returns response
 */
export async function getAllScenariosForCase(url, id) {
  const response = await fetch(`${url }/case/${id}`).catch((e) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(e));
    return e;
  });
  return response.json();
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app 
 * @param {Object} scenarioConfig - configuration object of a scenario
 */
export async function loadScenario(app, scenarioConfig) {
  removeContentTreeItems(app);
  const plugin = app.plugins.getByKey('duetviewer');
  const { config } = plugin;
  removeDuetLayers(app);
  // load viewpoint from scenario config
  viewpointLoader(app, scenarioConfig.x_coordinate, scenarioConfig.y_coordinate, scenarioConfig.userViewpoint);

  // load layers from scenario config
  if (scenarioConfig.scenarioDatasources.length !== 0) {
    // eslint-disable-next-line max-len
    layerLoader(app, config.duetCatalogURL, plugin.state.credentials.value.accessToken, scenarioConfig.scenarioDatasources);
  }

  // load user styles from scenario config
  if (scenarioConfig.userStyles !== '') {
    await styleLoader(app, JSON.parse(scenarioConfig.userStyles));
    dueterror.addError({ function: 'loadScenario()', message: 'styles from scenario config loaded...' }, 1);
  }

  // apply styles from config to layers
  if (scenarioConfig.usedStyles !== '') {
    const usedStyles = JSON.parse(scenarioConfig.usedStyles);
    Object.keys(usedStyles).forEach((key) => {
      usedStyles[key].forEach((layer) => {
        setUsedStyleForDuetLayer(app, layer, key);
      });
    });
    // eslint-disable-next-line no-console
    console.log('styles applied to layers...');
  }

  // Load experiments
  if (scenarioConfig.scenarioModels.length !== 0) {
    plugin.state.experiments.value = await getAllExperimentsForScenario(scenarioConfig.scenarioModels);
  }
  // activate layers as defined in scenario config and deactivate all others loaded from config
  if (scenarioConfig.activeLayers.length !== 0) {
    const layersToActivate = scenarioConfig.activeLayers;
    let found = false;
    await Promise.all(layersToActivate.map(async (name) => {
      const experimentsToActivate = scenarioConfig.scenarioModels.filter(el => el.includes(name));
      if (experimentsToActivate.length !== 0) {
        const experiment = plugin.state.experiments.value.find(el => el._id === name);
        plugin.state.experiment.value = experiment;
        plugin.state.experimentId.value = experiment.title;
        found = true;
        loadExperiment(app, experiment);
        return Promise.resolve('true');
      } else {
        return Promise.resolve('true');
      }
    }));
    if (!found) {
      plugin.state.experiment.value = {};
      plugin.state.experimentId.value = 0;
    }
    const layers = Array.from(app.layers).filter((el) => {
      if (Object.hasOwn(el.properties, 'duetType')) {
        return el;
      }
      return null;
    }).map(el => el.name);
    layers.forEach((l) => {
      const layer = app.layers.getByKey(l);
      if (layer && !layer.name.includes('roadClosures')) {
        layer.deactivate();
      }
    });
    layersToActivate.forEach((l) => {
      const layer = app.layers.getByKey(l);
      if (layer && !layer.name.includes('roadClosures')) {
        layer.activate();
      }
    });
  }
}

