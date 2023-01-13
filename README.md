# duetviewer

This plugin will be based on new vc map ui and core. It will mainly display duet cases, scenarios and experiments in new vc map.
The intention of that viewer is not to recreate the full capabilities of the viewer developed during the DUET project. The here published viewer shows how VC Core & VC MAP UI can be used for further developments based on DUET'S backend components.

Thus the used configuration of that plugin relates to DUET services / backend components, even if they are not used in this viewer here.

## Developer intro

```
git clone https://github.com/virtualcitySYSTEMS/duet-viewer
npm i
npm start
```

Information about VC Core can be found here [VC Core](https://github.com/virtualcitySYSTEMS/map-core).

Information about VC MAP UI can be found here [VC MAP UI](https://github.com/virtualcitySYSTEMS/map-ui).

Information about VC Plugin CLI can be found here [VC Plugin CLI](https://github.com/virtualcitySYSTEMS/map-plugin-cli).

## Plugin configuration via config.json

```
{
    "name": "duetviewer", // name of the plugin
    "version": "1.0.0", // version of the plugin
    "getDataFrom": "duet",    // get data from duet catalog => config for later use of other catalogs such as CKAN
    "dev-mode": true, // property for running app in dev or production mode e.g. if topics and services have the same names in both environments this will give the app the possibiloity to simply switch between the different environments by just reacting on the flag and maybe adding a '-dev' at the end of service names
    "apiKey": "", // empty
    "entry": "plugins/duetviewer/index.js",   // entry point of plugin in VC MAP
    "duetCatalogURL": "https://duet.virtualcitymap.de/openBetaDev/duetCatalog-dev/",  // URL to DUET catalog
    "baseURL": "https://services.citytwin.eu",    // base url of environment
    "appReceiverURL": "/publish", // URL of service to publish messages to
    "appSenderURL": "https://services.citytwin.eu/app-sender/websocket",  // URL of a service to retrieve messages from 
    "casesURL": "https://services.citytwin.eu/cases-dev/",    // URL of a case service 
    "commentsURL": "https://services.citytwin.eu/comments",   // URL of a comments service 
    "interactionURL": "interaction-api/", // URL / proxy url to DUET's interaction api
    "federatedURL": "federated/", // URL / proxy url to DUET's federated api
    "scenarioURL": "https://services.citytwin.eu/scenarios-dev/scenarios",    // URL / proxy url to DUET's scenario service
    "experimentURL": "https://services.citytwin.eu/scenarios-dev/experiments",    // URL / proxy url to DUET's experiment service
    "referenceData":{ // reference data mapping in case of the model results are not providing reference data for delta calculation
        "kul-gent":"https://duet.virtualcitymap.de/alpha/datasource-data/Traffic/Gent_road_network_dev.json",
        "road-network-calculation-result-flanders":"https://duet.virtualcitymap.de/alpha/datasource-data/Traffic/GMNS/links_Antwerp.json",
        "road-network-calculation-result-athens":"https://duet.virtualcitymap.de/alpha/datasource-data/Traffic/Traffic_Athens/streets_Athens.json",
        "road-network-calculation-result-pilsen":"https://duet.virtualcitymap.de/alpha/datasource-data/Traffic/Plzen_traffic.json"
    },
    "models": [   //string array of models
        "traffic",
        "noise",
        "air",
        "control",
        "error"
    ],
    "traffic": [  //Array of objects for each above mentioned model
        {
            "region": "Pilsen", // name of the region
            "topicForResults": "/topic/road-network-calculation-result-pilsen", // result topic
            "topicForChanges": "road-network-pilsen",   // topic to publish chnages to
            "type": "traffic"   //type of model
        }
    ],
    "noise": [
        {
            "region": "Pilsen", // name of the region
            "topicForResults": "/topic/noise-calculation-result-pilsen", // result topic
            "topicForChanges": "",  // since changes are not made to noise => empty string
            "type": "noise" //type of model
        }
    ],
    "air": [
        {
            "region": "Pilsen", // name of the region
            "topicForResults": "/topic/air-calculation-result-pilsen",  // result topic
            "topicForChanges": "",  // since changes are not made to noise => empty string
            "type": "air"   //type of model
        }
    ],
    "control": [    // Array of control topics especcially relevant for TNO models for saving sim results permamently
        {
            "region": "Athens", // name of the region
            "topicForResults": "/topic/noise-calculation-result-athens",    // topic for expecting results
            "topicForChanges": "/topic/noise-calculation-control-athens",   // topic for sending control messages to
            "type": "control"   //type of model
        }
    ],
    "error": [  // Array of error topics
        {
        "region": "all",    // valid for all regions
        "topicForResults": "/topic/duet-error", // topic for receiving error messages
        "topicForChanges": "duet-error",    // topic for sending error messages to
        "type": "error"     //type of model
        }
    ]
}
```