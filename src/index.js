import { WindowSlot, ButtonLocation, createToggleAction } from '@vcmap/ui';
import { ref } from 'vue';
import { customAlphabet } from 'nanoid';
import { version, name } from '../package.json';
import ThemeChangerComponent from './ui/ThemeChangerComponent.vue';
import duetMain, { windowMainId } from './ui/duetMain.vue';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

/**
 * @param {T} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T>}
 * @template {Object} T
 * @template {Object} S
 */
export default function load(config) {
  const pluginState = {
    colors: ref(['#edf8fb', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#6e016b']),
    textColors: ref(['grey--text', 'grey--text', 'grey--text', 'grey--text', 'white--text', 'white--text', 'white--text']),
    clientid: ref(''),
    credentials: ref({
      username: '',
    }),
    caseId: ref(0),
    case: ref({}),
    scenarios: ref([]),
    scenario: ref({}),
    scenarioId: ref(0),
    experiments: ref([]),
    experiment: ref({}),
    experimentId: ref(0),
    pilot: ref(''),
    region: ref([]),
    scenarioIds: ref([]),
  };
  return {
    config,
    state: pluginState,
    get name() { return name; },
    get version() { return version; },

    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @returns {Promise<void>}
     */
    onVcsAppMounted: async (vcsUiApp) => {
      // console.log('Called when the root UI component is mounted and managers are ready to accept components');
      pluginState.clientid.value = `interaction-client-${ nanoid()}`;
      const { action: duetAction } = createToggleAction(
        {
          name,
          title: 'duetCaseSelector.btn_title',
          icon: 'mdi-domain',
        },
        {
          id: windowMainId,
          component: duetMain,
          props: {
            config,
          },
          state: {
            headerTitle: 'duetCaseSelector.btn_title',
            styles: { 'background-color': pluginState.colors[0] },
          },
          WindowSlot: WindowSlot.DETACHED,
          position: {
            width: 450,
            height: 400,
          },
        },
        vcsUiApp.windowManager,
        name,
      );
      const { action: themeAction } = createToggleAction(
        {
          name: 'Duet Theme Changer',
          icon: 'mdi-palette',
        },
        {
          id: 'theme-changer',
          component: ThemeChangerComponent,
          position: {
            left: '60%',
            right: '0%',
            top: '5%',
            bottom: '50%',
          },
          state: {
            headerTitle: 'Duet Theme Changer',
            headerIcon: 'mdi-palette',
          },
        },
        vcsUiApp.windowManager,
        name,
      );
      vcsUiApp.navbarManager.add(
        { action: themeAction },
        'theme-changer',
        ButtonLocation.MENU,
      );
      vcsUiApp.navbarManager.add(
        { action: duetAction },
        name,
        ButtonLocation.TOOL,
      );
      vcsUiApp.windowManager.add({
        id: windowMainId,
        component: duetMain,
        state: {
          headerTitle: 'duetCaseSelector.btn_title',
          styles: { 'background-color': pluginState.colors[0] },
        },
        WindowSlot: WindowSlot.DETACHED,
        position: {
          width: 450,
          height: 400,
        },
      }, name);
    },
    i18n: {
      en: {
        duetCaseSelector: {
          title: 'Available cases',
          btn_title: 'DUET main entry',
          close: 'Close',
          case_btn: 'Cases',
          selected_case: 'selected case',
          scenario_btn: 'Scenarios',
          selected_scenario: 'selected scenario',
          selected_experiment: 'selected',
          experiment_btn: 'Experiments',
          case_wiz_btn: 'Creation',
          data_btn: 'Data',
          login_btn: 'Login',
          case_title_hover: 'Accessing DUET Cases',
          scenario_title_hover: 'Accessing Scenario of Case',
          experiment_title_hover: 'Accessing Experiments of Case',
          case_wiz_title_hover: 'Create DUET cases / Scenarios',
          data_title_hover: 'Accessing DUET Data',
          login_title_hover: 'Login to DUET Environment',

        },
        login: {
          login_title_form: 'Login form',
          login_username: 'Username',
          login_password: 'Password',
          login_btn: 'Login',
        },
      },
      de: {
        duetCaseSelector: {
          btn_title: 'DUET Hauptportal',
          title: 'Verfügbare Fälle',
          close: 'Schließen',
          data_btn: 'Daten',
          case_btn: 'Fälle',
          selected_case: 'gewählter Fall',
          selected_scenario: 'gewähltes Szenario',
          selected_experiment: 'gewählt',
          scenario_btn: 'Szenarien',
          experiment_btn: 'Experimente',
          case_wiz_btn: 'Erstellen',
          login_btn: 'Anmelden',
          case_title_hover: 'Zugang zu DUET Fällen',
          scenario_title_hover: 'Zugang zu Szenarien des Falles',
          experiment_title_hover: 'Zugang zu Experimenten des Falles',
          case_wiz_title_hover: 'Erstellen von DUET Fällen und Szenarien',
          data_title_hover: 'Zugang zu DUET Daten',
          login_title_hover: 'In DUET Umgebung anmelden',
        },
        login: {
          login_title_form: 'Anmeldeformular',
          login_username: 'Benutzername',
          login_password: 'Passwort',
          login_btn: 'Anmelden',
        },
      },
    },
    destroy() {
    },
  };
}
