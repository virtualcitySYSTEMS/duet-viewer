import { createBlockageLayer, removeContentTreeItems } from './duetAPI.js';
import { modelResultLoader } from './loaders.js';


/**
 * Loads all experiments for a case via id
 * @param {string} url - url of experiment manager
 * @param {integer} id - id of case
 * @returns {Array<objects>} - returns an array of DUET experiments
 */
export async function getAllExperimentsForCase(url, id) {
  const response = await fetch(`${url }/case/${id}`).catch((e) => {
    return e;
  });
  return response.json();
}

/**
 * Loads all experiments of a scenario
 * @param {Array<strings>} modelsArray - array of urls pointing to specific experiments for that scenario
 * @returns {Array<objects>} - returns an array of DUET experiments
 */
export async function getAllExperimentsForScenario(modelsArray) {
  const promises = await Promise.all(modelsArray.map(async (exp) => {
    if (exp !== '') {
      const response = await fetch(exp).catch((e) => {
        return e;
      });
      return response.json();
    } else {
      return Promise.resolve('true');
    }
  }));
  return promises.filter(el => el !== 'true');
}

/**
 * Loads an experiment from experiments config
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used
 * @param {Object} experiment - config of experiment
 * @returns {Promise<cases>} - returns object of cases, pageIndex, pageSize, totalPages
 */
export async function loadExperiment(app, experiment) {
  removeContentTreeItems(app);
  if (experiment.features) {
    createBlockageLayer(app, experiment);
  }
  if (experiment.models.length !== 0) {
    modelResultLoader(app, experiment.models, experiment.title);
  }
}
