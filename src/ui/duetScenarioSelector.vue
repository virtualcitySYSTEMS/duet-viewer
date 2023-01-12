<template>
  <v-container>
    <v-row justify="space-around">
      <v-card width="400">
        <v-card-text>
          <div class="font-weight-black ml-8 mb-2">
            <strong>Case: {{ selectedCase }}</strong>
          </div>
          <v-timeline align-top dense>
            <v-timeline-item v-for="(oneCase, idx) in fetchedScenarios" :key="idx" :color="colors[3]" small>
              <v-card :color="colors[3]" dark>
                <v-card-title class="text-h6">
                  <strong>scenario: {{ oneCase.id }}</strong>
                </v-card-title>
                <v-card-subtitle>
                  {{ oneCase.title }}
                </v-card-subtitle>
                <v-card-text class="white grey--text text--darken-2">
                  <p>
                    {{ oneCase.desc }}
                  </p>
                  <v-btn
                    v-if="activeScenario.id !== oneCase.id"
                    :color="colors[3]"
                    class="mx-0"
                    outlined
                    @click="selectScenario(oneCase)"
                  >
                    Load Scenario
                  </v-btn>
                  <v-btn
                    v-if="activeScenario.id === oneCase.id"
                    :color="colors[3]"
                    class="mx-0"
                    @click="selectScenario(oneCase)"
                  >
                    Unload Scenario
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
  import { inject, computed } from 'vue';
  import {
    VContainer, VRow, VCard, VTimeline, VTimelineItem, VCardText, VCardTitle, VCardSubtitle, VBtn,
  } from 'vuetify/lib';
  import { loadScenario } from '../duet-api/duetScenario.js';
  import { removeDuetLayers } from '../duet-api/duetAPI.js';

  export const windowScenarioId = 'duetScenarioSelector-id';


  export default {
    name: 'DuetScenarioSelector',
    components: {
      // eslint-disable-next-line max-len
      VContainer, VRow, VCard, VTimeline, VTimelineItem, VCardText, VCardTitle, VCardSubtitle, VBtn,
    },
    setup() {
      /** @type { import("@vcmap/ui").VcsUiApp } */
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const activeScenario = computed(() => (plugin.state.scenario.value));
      const fetchedScenarios = computed(() => (plugin.state.scenarios.value));
      const selectedCase = computed(() => (plugin.state.caseId.value));
      // const activeScenario = ref();
      async function selectScenario(selectedScenario) {
        removeDuetLayers(app);
        // activeScenario.value=selectedScenario.id;
        if (activeScenario.value.id === selectedScenario.id) {
          plugin.state.scenario.value = {};
          plugin.state.experiment.value = {};
          plugin.state.scenarioId.value = 0;
          plugin.state.experimentId.value = 0;
        } else {
          plugin.state.scenario.value = selectedScenario;
          plugin.state.scenarioId.value = selectedScenario.id;
          loadScenario(app, selectedScenario);
        }
      }
      return {
        fetchedScenarios,
        activeScenario: computed(() => (plugin.state.scenario.value)),
        colors: computed(() => (plugin.state.colors.value)),
        textColors: computed(() => (plugin.state.textColors.value)),
        selectedCase,
        loading: undefined,
        closeSelf() {
          app.windowManager.remove(windowScenarioId);
        },
        selectScenario,
      };
    },
  };
</script>
