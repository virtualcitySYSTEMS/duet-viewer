import dueterror from './errorlogging.js';
import { tnoModelResultLoader } from './loaders.js';

let stompClient = null;

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used 
 * @param {Object} msg - received message from message broker 
 * @param {string} topic - topic of incomming message 
 */
async function genericMessage(app, msg, topic) {
  const plugin = app.plugins.getByKey('duetviewer');
  const json = JSON.parse(msg.body);
  if (json.scenarioid) {
    if (plugin.state.scenarioIds.value.includes(json.scenarioid)) {
      if (Object.hasOwn(json, 'tilesurl')) {
        let type = 'air';
        if (topic.includes('noise')) {
          type = 'noise';
        }
        const added = await tnoModelResultLoader(app, json, type);
        if (added) {
          const scenarioIndex = plugin.state.scenarioIds.value.findIndex(x => x === json.scenarioid);
          if (scenarioIndex > -1) {
            plugin.state.scenarioIds.value.splice(scenarioIndex, 1);
          }
        }
      }
    }
  }
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used 
 * @returns available topics defined by plugin config
 */
function initializeTopics(app) {
  const plugin = app.plugins.getByKey('duetviewer');
  const { config } = plugin;
  const availabletopics = {};
  if (config.models) {
    const topicArray = [];
    config.models.forEach((topics) => {
      topicArray.push(...config[topics]);
    });
    // console.log(topicArray);
    const types = [...new Set(topicArray.map(el => el.type))];
    types.forEach((type) => {
      availabletopics[type] = topicArray.filter(el => el.type === type);
    });
  }
  return availabletopics;
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns traffic topics for region
 */
function getTrafficTopics(availabletopics, region) {
  return availabletopics.traffic.filter(el => (el.region === region || el.region === 'all'));
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns noise topics for region
 */
function getNoiseTopics(availabletopics, region) {
  return availabletopics.noise.filter(el => (el.region === region || el.region === 'all'));
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns air topics for region
 */
function getAirTopics(availabletopics, region) {
  return availabletopics.air.filter(el => (el.region === region || el.region === 'all'));
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns control topics for region
 */
function getControlTopics(availabletopics, region) {
  return availabletopics.control.filter(el => (el.region === region || el.region === 'all'));
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns error topics for region
 */
function getErrorTopics(availabletopics, region) {
  return availabletopics.error.filter(el => (el.region === region || el.region === 'all'));
}

/**
 * @param {Array<Objects>} availabletopics - array of topics from config
 * @param {string} region - pilot / region defined by case / scenario
 * @returns misc topics for region (everything not being a ['traffic', 'noise', 'air', 'control', 'error'] topic)
 */
function getMiscTopics(availabletopics, region) {
  // let miscTopics=[];
  const duetTopics = ['traffic', 'noise', 'air', 'control', 'error'];
  const results = [];
  Object.keys(availabletopics).forEach((k) => {
    if (!duetTopics.includes(k)) {
      results.push(...availabletopics[k].filter(el => (el.region === region || el.region === 'all')));
    }
  });
  return results;
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used 
 * @param {Array<Objects>} devtopics - array with topics to subscribe to
 */
export function getWebSocket(app, devtopics) {
  const plugin = app.plugins.getByKey('duetviewer');
  const { config } = plugin;
  const url = `${config.baseURL}/app-sender/websocket`;
  let topics;
  // eslint-disable-next-line no-undef
  const sock = new SockJS(url);
  let messageTopic;
  if (config['dev-mode']) {
    topics = devtopics.map((el) => {
      if (el.topicForResults !== '' && el.type !== 'control') {
        return `${el.topicForResults}-dev`;
      } else {
        return `${el.topicForChanges}-dev`;
      }
    });
  } else {
    topics = devtopics.map((el) => {
      if (el.topicForResults !== '' && el.type !== 'control') {
        return el.topicForResults;
      } else {
        return el.topicForChanges;
      }
    });
  }
  // eslint-disable-next-line func-names
  const errorCallback = function (error) {
    getWebSocket(app, devtopics);
    if (error.headers) {
      if (error.headers.message) {
        dueterror.addError({ function: 'getWebSocket()', message: `Error connecting to DUET websockets. Issue is:\n${ JSON.stringify(error.headers.message)}` }, 3);
      } else {
        dueterror.addError({ function: 'getWebSocket()', message: `Error connecting to DUET websockets. Issue is:\n${ JSON.stringify(error.headers)}` }, 3);
      }
    } else {
      dueterror.addError({ function: 'getWebSocket()', message: `Error connecting to DUET websockets. Issue is:\n${ JSON.stringify(error)}` }, 3);
    }
  };
  // eslint-disable-next-line no-undef
  stompClient = Stomp.over(sock);
  stompClient.debug = () => {};
  stompClient.connect({}, (frame) => {
    // eslint-disable-next-line no-console
    console.log(`Websockets are: ${frame.command}`);
    stompClient.debug = () => {};
    topics.forEach((topic) => {
      // eslint-disable-next-line no-console
      console.log(`Subscribed to topic: ${topic}`);
      stompClient.subscribe(topic, (message) => {
        messageTopic = topic.toString().replace('/topic/', '');
        genericMessage(app, message, messageTopic);
      });
    });
  }, errorCallback);
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app - VCS app to be used 
 * @param {string} pilot - region or pilot name
 */
export async function initialize(app, pilot) {
  const topics = initializeTopics(app);
  let pilotTopics = [];
  if (pilot.toLowerCase() === 'flanders') {
    pilotTopics = [...pilotTopics,
      getTrafficTopics(topics, 'Gent'),
      getAirTopics(topics, 'Gent'),
      getNoiseTopics(topics, 'Gent'),
      getErrorTopics(topics, 'Gent'),
      getControlTopics(topics, 'Gent'),
      getMiscTopics(topics, 'Gent')].flat();
  }
  pilotTopics = [...pilotTopics,
    getTrafficTopics(topics, pilot),
    getAirTopics(topics, pilot),
    getNoiseTopics(topics, pilot),
    getErrorTopics(topics, pilot),
    getControlTopics(topics, pilot),
    getMiscTopics(topics, pilot)].flat();
  const uniquepilotTopics = pilotTopics.filter(
    (value, index, self) => index === self.findIndex(
      t => (t.topicForResults === value.topicForResults && t.type === value.type),
    ),
  );
  getWebSocket(app, uniquepilotTopics);
}

