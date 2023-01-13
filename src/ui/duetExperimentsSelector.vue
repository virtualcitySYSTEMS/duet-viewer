<template>
  <v-container>
    <v-row justify="space-around">
      <v-card width="400">
        <v-card-text>
          <div class="font-weight-bold ml-8 mb-2">
            <strong v-if="selectedScenario===0">Case: {{ selectedCase }}</strong>
            <strong v-else>Scenario: {{ selectedScenario }}</strong>
          </div>
          <v-timeline align-top dense>
            <v-timeline-item v-for="(oneCase, index) in fetchedExperiments" :key="index" :color="colors[5]" small>
              <v-card :color="colors[5]" dark>
                <v-card-title class="text-h6">
                  <strong>experiment</strong>
                </v-card-title>
                <v-card-subtitle>
                  {{ oneCase.title }}
                </v-card-subtitle>
                <v-card-text class="white grey--text text--darken-2">
                  <p>
                    {{ oneCase.desc }}
                  </p>
                  <v-chip
                    small
                    class="mr-2 my-2"
                    :color="colors[5]"
                    label
                    v-for="(model,i) in oneCase.types"
                    :key="i"
                  >
                    {{ model }}
                  </v-chip>
                  <v-btn
                    v-if="activeExperiment._id !== oneCase._id"
                    :color="colors[5]"
                    class="mx-0"
                    outlined
                    @click="selectExperiment(oneCase)"
                  >
                    Load Experiment
                  </v-btn>
                  <v-btn
                    v-if="activeExperiment._id === oneCase._id"
                    :color="colors[5]"
                    class="mx-0"
                    @click="selectExperiment(oneCase)"
                  >
                    Unload Experiment
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
  import { computed, inject } from 'vue';
  import {
    VBtn, VCard, VCardSubtitle, VCardText, VCardTitle, VChip, VContainer, VRow, VTimeline, VTimelineItem,
  } from 'vuetify/lib';
  import { removeDuetLayers } from '../duet-api/duetAPI.js';
  import { loadExperiment } from '../duet-api/duetExperiment.js';
  import dueterror from '../duet-api/errorlogging.js';

  export const windowExpId = 'duetExpSelector-id';


  export default {
    name: 'DuetExperimentSelector',
    components: {
      VContainer,
      VRow,
      VCard,
      VTimeline,
      VTimelineItem,
      VCardText,
      VCardTitle,
      VCardSubtitle,
      VBtn,
      VChip,
    },
    setup() {
      /** @type { import("@vcmap/ui").VcsUiApp } */
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const fetchedExperiments = computed(() => (plugin.state.experiments.value));
      const selectedCase = computed(() => (plugin.state.caseId.value));
      const selectedScenario = computed(() => (plugin.state.scenarioId.value));
      const activeExperiment = computed(() => (plugin.state.experiment.value));
      /**
       *
       * @param {Object} selectedExperiment - config object from selected experiment (fetched from DUET experiment service)
       */
      async function selectExperiment(selectedExperiment) {
        removeDuetLayers(app, 'simresults');
        if (activeExperiment.value._id === selectedExperiment._id) {
          plugin.state.experiment.value = {};
          plugin.state.experimentId.value = 0;
        } else {
          // activeExperiment.value=selectedExperiment.id;
          plugin.state.experiment.value = selectedExperiment;
          plugin.state.experimentId.value = selectedExperiment.title;
          await loadExperiment(app, selectedExperiment);
          dueterror.addError({ function: 'selectExperiment()', message: `Experiment ${selectedExperiment._id} successfully loaded` }, 1);
        }
      }
      return {
        fetchedExperiments,
        activeExperiment: computed(() => (plugin.state.experiment.value)),
        colors: computed(() => (plugin.state.colors.value)),
        textColors: computed(() => (plugin.state.textColors.value)),
        selectedCase,
        selectedScenario,
        loading: undefined,
        closeSelf() {
          app.windowManager.remove(windowExpId);
        },
        selectExperiment,
      };
    },
  };
</script>
