<template>
  <v-container class="pa-0">
    <v-list v-if="Object.keys(activeCase).length!=0">
      <v-card
        class="ma-1"
        height="3.5em"
        :color="activeCase.status==='started' ? 'accent' : undefined"
        @click="selectCase(activeCase)"
        hover
        outlined
        :loading="loading === activeCase.title"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ activeCase.id }} - {{ activeCase.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ activeCase.approach }} - last updated: {{ activeCase.updated }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar
              color="success"
              size="30"
            >
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
      </v-card>
    </v-list>
    <v-list
      v-for="(oneCase, index) in fetchedCases"
      :key="index"
    >
      <v-card
        class="ma-1"
        height="3.5em"
        :color="oneCase.status==='started' ? 'accent' : undefined"
        @click="selectCase(oneCase)"
        hover
        outlined
        :loading="loading === oneCase.title"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ oneCase.id }} - {{ oneCase.title }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ oneCase.approach }} - last updated: {{ oneCase.updated }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar
              color="success"
              size="30"
              v-if="activeCase===oneCase.id"
            >
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
      </v-card>
    </v-list>
    <div class="text-center">
      <v-pagination
        top
        v-model="page"
        :length="pages"
        :total-visible="8"
        @next="callCaseManager(page-1)"
        @previous="callCaseManager(page-1)"
        @input="callCaseManager(page-1)"
      />
    </div>
  </v-container>
</template>

<script>
  import { inject, ref, computed } from 'vue';
  import {
    // eslint-disable-next-line max-len
    VContainer, VList, VListItem, VListItemAction, VListItemTitle, VListItemSubtitle, VListItemContent, VCard, VAvatar, VIcon, VPagination,
  } from 'vuetify/lib';
  import { getCasesFromManager, loadCase } from '../duet-api/duetCases.js';
  import { getAllScenariosForCase } from '../duet-api/duetScenario.js';
  import { getAllExperimentsForCase } from '../duet-api/duetExperiment.js';
  import dueterror from '../duet-api/errorlogging.js';
  import validateConfig from '../duet-api/getPluginConf.js';
  import { removeDuetLayers } from '../duet-api/duetAPI.js';

  export const windowId = 'duetCaseSelector-id';


  export default {
    name: 'DuetCaseSelector',
    components: {
      // eslint-disable-next-line max-len
      VContainer, VList, VListItem, VListItemAction, VListItemTitle, VListItemSubtitle, VListItemContent, VCard, VAvatar, VIcon, VPagination,
    },
    setup() {
      const fetchedCases = ref([]);
      /** @type { import("@vcmap/ui").VcsUiApp } */
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const activeCase = computed(() => (plugin.state.case.value));
      // const config = inject(config);
      const page = ref(0);
      const pages = ref();

      const { config } = plugin;
      async function callCaseManager(index) {
        const data = await getCasesFromManager(config.casesURL, index); // 'https://services.citytwin.eu/cases-dev/',index)
        if (data) {
          page.value = data.pageIndex + 1;
          pages.value = data.totalPages;
          fetchedCases.value = [];
          fetchedCases.value.push(...data.allCases);
        }
      }
      const valid = validateConfig(config);
      if (valid) {
        callCaseManager(page.value);
      } else {
        dueterror.addError({ function: 'DuetCaseSelector()', message: 'Provided plugin config is invalid. Please correct it.' }, 3);
      }
      async function selectCase(selectedCase) {
        removeDuetLayers(app);
        if (Object.keys(activeCase.value).length !== 0) {
          // setting state to empty
          app.windowManager.remove('duetScenarioSelector-id');
          app.windowManager.remove('duetExpSelector-id');
          plugin.state.scenarios.value = [];
          plugin.state.experiments.value = [];
          plugin.state.case.value = {};
          plugin.state.scenario.value = {};
          plugin.state.experiment.value = {};
          plugin.state.caseId.value = 0;
          plugin.state.scenarioId.value = 0;
          plugin.state.experimentId.value = 0;
        } else {
          // setting state to empty
          app.windowManager.remove('duetScenarioSelector-id');
          app.windowManager.remove('duetExpSelector-id');
          plugin.state.scenarios.value = [];
          plugin.state.experiments.value = [];
          plugin.state.case.value = {};
          plugin.state.scenario.value = {};
          plugin.state.experiment.value = {};

          // fetching case
          plugin.state.caseId.value = selectedCase.id;
          plugin.state.scenarioId.value = 0;
          plugin.state.experimentId.value = 0;
          plugin.state.case.value = selectedCase;
          loadCase(app, config, selectedCase, plugin.state.credentials.value.accessToken);
          plugin.state.scenarios.value = await getAllScenariosForCase(config.scenarioURL, selectedCase.id);
          if (plugin.state.scenarios.value.length > 0) {
            dueterror.addError({ function: 'selectCase() in duetCaseSelector', message: `${plugin.state.scenarios.value.length } scenarios found for case: ${selectedCase.id}` }, 1);
          }
          plugin.state.experiments.value = await getAllExperimentsForCase(config.experimentURL, selectedCase.id);
          if (plugin.state.experiments.value.length > 0) {
            dueterror.addError({ function: 'selectCase() in duetCaseSelector', message: `${plugin.state.experiments.value.length } experiments found for case: ${selectedCase.id}` }, 1);
          }
          app.windowManager.remove(windowId);
        }
      }

      return {
        fetchedCases,
        activeCase: computed(() => (plugin.state.case.value)),
        page,
        pages,
        loading: undefined,
        closeSelf() {
          app.windowManager.remove(windowId);
        },
        selectCase,
        callCaseManager,
      };
    },
  };
</script>
