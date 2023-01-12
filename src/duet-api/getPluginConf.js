import dueterror from './errorlogging.js';

/**
 * @param {object} conf - plugin configuration file to be validated by function  
 * @returns 
 */
export default function validateConfig(conf) {
  // console.log("Config will be validated");
  let modelsCheck = false;
  let paramCheck = false;
  if (Object.hasOwn(conf, 'models')) { // conf.hasOwnProperty('models')) {
    if (conf.models !== '' && Array.isArray(conf.models)) {
      const modelsArrayCheck = conf.models.map((m) => {
        if (Object.hasOwn(conf, m)) {
          if (Array.isArray(conf[m]) && conf[m].length > 0) {
            return 'true';
          } else {
            dueterror.addError({ function: 'validateConfig()', message: `config for model${ m } is not an array OR array is empty` }, 3);
            return 'false';
          }
        } else {
          dueterror.addError({ function: 'validateConfig()', message: `config for  model ${m } cannot be found` }, 3);
          return 'false';
        }
      });
      const unique = [...new Set(modelsArrayCheck)];
      if (unique.length === 1 && unique.includes('true')) {
        modelsCheck = true;
      }
    } else {
      dueterror.addError({ function: 'validateConfig()', message: 'config for models is either empty OR not an array' }, 3);
    }
  } else {
    modelsCheck = true;
    // eslint-disable-next-line no-console
    dueterror.addError({
      function: 'validateConfig()',
      message: 'In your plugin configuration no models are defined! Thus simulations cannot be triggered and results cannot be fetched from DUET environment!',
    }, 2);
  }
  if (Object.hasOwn(conf, 'duetCatalogURL')) {
    if (conf.duetCatalogURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of duetCatalogURL is empty. Please fill in a URL pointing to DUET's asset catalog",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of duetCatalogURL is not present! Please add "duetCatalogURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'casesURL')) {
    if (conf.casesURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of casesURL is empty. Please fill in a URL pointing to DUET's cases manager",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of casesURL is not present! Please add "casesURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'commentsURL')) {
    if (conf.commentsURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of commentsURL is empty. Please fill in a URL pointing to DUET's comments endpoint",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of commentsURL is not present! Please add "commentsURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'scenarioURL')) {
    if (conf.scenarioURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of scenarioURL is empty. Please fill in a URL pointing to DUET's scenario manager",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of scenarioURL is not present! Please add "scenarioURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'experimentURL')) {
    if (conf.experimentURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of experimentURL is empty. Please fill in a URL pointing to DUET's experiments manager",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of experimentURL is not present! Please add "experimentURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'federatedURL')) {
    if (conf.federatedURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of federatedURL is empty. Please fill in a URL pointing to DUET's federated api endpoint",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of federatedURL is not present! Please add "federatedURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'appReceiverURL')) {
    if (conf.appReceiverURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: 'value of appReceiverURL is empty. Please fill in a URL to be able to send messages to the message broker',
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of appReceiverURL is not present! Please add "appReceiverURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'appSenderURL')) {
    if (conf.appSenderURL !== '') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: 'value of appSenderURL is empty. Please fill in a URL to be able to receive messages from message broker',
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of appSenderURL is not present! Please add "appSenderURL":"URL" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'getDataFrom')) {
    if (conf.getDataFrom !== '' && conf.getDataFrom === 'duet') {
      paramCheck = true;
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: "value of getDataFrom is empty OR not set to 'duet'. Please check the value and set it to 'duet'",
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of getDataFrom is not present! Please add "getDataFrom":"duet" to the plugin config!',
    }, 3);
  }
  if (Object.hasOwn(conf, 'dev-mode')) {
    if (conf['dev-mode'] !== '' && conf['dev-mode']) {
      paramCheck = true;
      // eslint-disable-next-line no-console
      console.log('Your plugin is set to run in DEV environment. Please make sure, that all URL and topics are available in DEV!');
    } else if (conf['dev-mode'] !== '' && !conf['dev-mode']) {
      paramCheck = true;
      // eslint-disable-next-line no-console
      console.log('Your plugin is set to run in PROD environment. Please make sure, that all URL and topics are available in PROD!');
    } else {
      dueterror.addError({
        function: 'validateConfig()',
        message: 'value of dev-mode is empty OR not set to true / false. Please check the value and set it to true / false',
      }, 3);
    }
  } else {
    dueterror.addError({
      function: 'validateConfig()',
      message: 'value of dev-mode is not present! Please add "dev-mode":<true|false> to the plugin config!',
    }, 3);
  }
  if (modelsCheck && paramCheck) {
    return true;
  } else {
    return false;
  }
}
