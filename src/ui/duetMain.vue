<template>
  <div>
    <v-container fluid>
      <v-row dense>
        <v-col v-for="(win, index) in winComponents" :key="`b-${index}`" :cols="win.flex" :disabled="win.disabled">
          <v-hover v-slot="{ hover }">
            <v-card
              @click="(e) => toggle(e, win.id)"
              :title="win.title? $t(win.title):win.state.headerTitle"
              :disabled="win.disabled"
              :color="state.colors.value[index]"
              dark
              :elevation="hover ? 12 : 2"
              :class="{ 'on-hover': hover }"
            >
              <v-card-title :class="state.textColors.value[index] + ' text--darken-4'">
                <v-avatar size="56">
                  <v-icon dark :class="state.textColors.value[index] + ' text--darken-4'">
                    {{ win.icon }}
                  </v-icon>
                </v-avatar>
                <p class="ml-1">
                  <strong>{{ $t(win.state.headerTitle) }}</strong>
                </p>
              </v-card-title>
              <template v-if="win.subtitle">
                <v-card-subtitle
                  :class="state.textColors.value[index] + ' text--darken-2'"
                  v-if="!isNaN(win.subtitle) && win.subtitle!==0"
                >
                  {{ $t(win.subTitleText) }}: {{ win.subtitle }}
                </v-card-subtitle>
                <v-card-subtitle
                  :class="state.textColors.value[index] + ' text--darken-2'"
                  v-else-if="win.subtitle!=='' && win.id.includes('Exp')"
                >
                  {{ $t(win.subTitleText) }}: {{ win.subtitle }}
                </v-card-subtitle>
                <v-card-subtitle
                  :class="state.textColors.value[index] + ' text--darken-2'"
                  v-else-if="win.subtitle!==''"
                >
                  {{ win.subtitle }}
                </v-card-subtitle>
              </template>
              <template v-else>
                <v-card-actions />
              </template>
              <!--v-card-subtitle v-if="win.id.includes('experi')">
                  available:
                </v-card-subtitle-->
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script>
  import { WindowSlot } from '@vcmap/ui';
  import { computed, inject, reactive, ref } from 'vue';
  import {
    VAvatar, VCard, VCardActions, VCardSubtitle, VCardTitle, VCol, VContainer, VHover, VIcon, VRow,
  } from 'vuetify/lib';
  import duetCaseSelector, { windowId } from './duetCaseSelector.vue';
  import duetExperimentSelector, { windowExpId } from './duetExperimentsSelector.vue';
  import duetScenarioSelector, { windowScenarioId } from './duetScenarioSelector.vue';
  import EmptyComponent from './emptyComponent.vue';
  import login from './login.vue';

  const showTestClass = ref(false);
  export const windowMainId = 'duetMain-id';


  export default {
    name: 'DuetMain',
    components: {
      // eslint-disable-next-line max-len
      VContainer, VCol, VRow, VHover, VCard, VAvatar, VIcon, VCardTitle, VCardActions, VCardSubtitle,
    },
    mounted() {
      // adding SOCKjs as script to plugin => needs to be replaced via correct npm module
      const sockScript = document.createElement('script');
      sockScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js');
      document.head.appendChild(sockScript);
      // adding Stomp.js as script to the plugin => needs to be replaced by correct npm module
      const stompScript = document.createElement('script');
      stompScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js');
      document.head.appendChild(stompScript);
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const loggedIn = computed(() => !Object.hasOwn(plugin.state.credentials.value, 'accessToken'));
      const user = computed(() => (plugin.state.credentials.value.username));
      const scenariosAvailable = computed(() => !(plugin.state.scenarios.value.length > 0));
      const experimentsAvailable = computed(() => !(plugin.state.experiments.value.length > 0));
      const caseId = computed(() => (plugin.state.caseId.value));
      const scenarioId = computed(() => (plugin.state.scenarioId.value));
      const experimentId = computed(() => (plugin.state.experimentId.value));
      const colors = computed(() => (plugin.state.colors.value));
      const textColors = computed(() => (plugin.state.textColors.value));
      const duetWindows = [
        {
          id: 'Login',
          flex: 6,
          title: 'duetCaseSelector.login_title_hover',
          state: {
            hideHeader: false,
            headerTitle: 'duetCaseSelector.login_btn',
            styles: { 'background-color': colors[0] },
          },
          disabled: false,
          subtitle: user,
          icon: 'mdi-48px mdi-account',
          color2: 'primary',
          component: login,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        {
          id: windowId,
          component: duetCaseSelector,
          state: {
            headerTitle: 'duetCaseSelector.case_btn',
            styles: { 'background-color': colors[1] },
          },
          props: {

          },
          provides: {

          },
          title: 'duetCaseSelector.case_title_hover',
          subtitle: caseId,
          subTitleText: 'duetCaseSelector.selected_case',
          icon: 'mdi-48px mdi-briefcase-account-outline',
          flex: 6,
          WindowSlot: WindowSlot.DETACHED,
          disabled: loggedIn,
          position: {
            left: '50%',
            right: '25%',
            top: '20%',
            bottom: '20%',
          },
        },
        {
          id: 'Data',
          flex: 6,
          title: 'duetCaseSelector.data_title_hover',
          state: {
            headerTitle: 'duetCaseSelector.data_btn',
            styles: { 'background-color': colors[2] },
          },
          disabled: loggedIn,
          icon: 'mdi-48px mdi-database',
          color2: '#276419',
          component: EmptyComponent,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        {
          id: windowScenarioId,
          component: duetScenarioSelector,
          state: {
            headerTitle: 'duetCaseSelector.scenario_btn',
            styles: { 'background-color': colors[3] },
          },
          color2: '#c51b7d',
          title: 'duetCaseSelector.scenario_title_hover',
          icon: 'mdi-48px mdi-animation',
          subtitle: scenarioId,
          subTitleText: 'duetCaseSelector.selected_scenario',
          flex: 6,
          WindowSlot: WindowSlot.DETACHED,
          disabled: scenariosAvailable,
          position: {
            left: '65%',
            right: '15%',
            height: 500,
          },
        },
        {
          id: 'Case_Wizard',
          component: EmptyComponent,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'duetCaseSelector.case_wiz_btn',
            styles: { 'background-color': colors[4] },
          },
          color2: '#4d9221',
          title: 'duetCaseSelector.case_wiz_title_hover',
          icon: 'mdi-48px mdi-briefcase-account-outline',
          flex: 6,
          disabled: loggedIn,
        },
        {
          id: windowExpId,
          component: duetExperimentSelector,
          state: {
            headerTitle: 'duetCaseSelector.experiment_btn',
            styles: { 'background-color': colors[5], color: textColors[5] },
          },
          color2: '#e9a3c9',
          title: 'duetCaseSelector.experiment_title_hover',
          icon: 'mdi-48px mdi-beaker-question',
          subtitle: experimentId,
          subTitleText: 'duetCaseSelector.selected_experiment',
          flex: 6,
          WindowSlot: WindowSlot.DETACHED,
          disabled: experimentsAvailable,
          position: {
            left: '65%',
            right: '15%',
          },
        },
      ];
      /**
       * @type {Map<string, WindowComponent>}
       */
      const windowComponents = new Map();
      return {
        state: plugin.state,
        active: false,
        disabled: false,
        update: false,
        loading: false,
        colors: reactive(() => (plugin.state.colors.value)),
        textColor: computed(() => (plugin.state.textColors.value)),
        /*         toggle() {
          this.active = !this.active;
        }, */
        toggleClass() {
          showTestClass.value = !showTestClass.value;
        },
        toggle(e, duetWindowId) {
          if (app.windowManager.has(duetWindowId)) {
            app.windowManager.remove(duetWindowId);
          } else {
            e.stopPropagation();
            const windowComponentOptions = windowComponents.get(duetWindowId) ||
              duetWindows.find(item => item.id === duetWindowId);
            windowComponentOptions.state.styles['background-color'] = colors.value[duetWindows.findIndex(item => item.id === duetWindowId)];
            const windowComponent = app.windowManager.add(windowComponentOptions, 'duetMain');
            windowComponents.set(duetWindowId, windowComponent);
          }
        },
        winComponents: duetWindows.map(reactive),
      };
    },
  };
</script>
