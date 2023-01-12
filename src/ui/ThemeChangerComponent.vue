<template>
  <v-card elevation="2">
    <v-radio-group>
      <v-hover v-slot="{ hover }" v-for="theme in Object.keys(colors)" :key="theme">
        <v-card outlined :elevation="hover ? 12 : 2" :class="{ 'on-hover': hover }">
          <v-list-item outlined>
            <v-list-item-action>
              <v-radio :value="theme" @click="setTheme(theme)" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                {{ theme }}
              </v-list-item-title>
              <div class="pa-4">
                <v-chip-group
                  active-class="primary--text"
                  column
                >
                  <v-chip
                    v-for="(color, index) in colors[theme]"
                    :key="theme+'-'+index"
                    :color="color"
                    label
                    :class="textColors[theme][index] + ' text--darken-4'"
                  >
                    {{ color }}
                  </v-chip>
                </v-chip-group>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-hover>
    </v-radio-group>
  </v-card>
</template>
<script>
  import { inject } from 'vue';
  import {
    // eslint-disable-next-line max-len
    VListItem, VListItemAction, VListItemTitle, VListItemContent, VCard, VChip, VChipGroup, VRadio, VRadioGroup, VHover,
  } from 'vuetify/lib';

  export default {
    name: 'DuetThemeChanger',
    components: {
      // eslint-disable-next-line max-len
      VListItem, VListItemAction, VListItemTitle, VListItemContent, VCard, VChip, VChipGroup, VRadio, VRadioGroup, VHover,
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const colors = {
        initial: ['primary', '#fde0ef', '#276419', '#c51b7d', '#4d9221', '#e9a3c9', '#4d9221'],
        greenlike: ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#005824'],
        pinklike: ['#edf8fb', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#6e016b'],
        bluelike: ['#f0f9e8', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#08589e'],
        redlike: ['#fef0d9', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#990000'],
      };
      const textColors = {
        initial: ['grey--text', 'grey--text', 'white--text', 'white--text', 'white--text', 'grey--text', 'white--text'],
        greenlike: ['grey--text', 'grey--text', 'grey--text', 'grey--text', 'grey--text', 'white--text', 'white--text'],
        pinklike: ['grey--text', 'grey--text', 'grey--text', 'grey--text', 'grey--text', 'white--text', 'white--text'],
        bluelike: ['grey--text', 'grey--text', 'grey--text', 'grey--text', 'grey--text', 'white--text', 'white--text'],
        redlike: ['grey--text', 'grey--text', 'grey--text', 'grey--text', 'grey--text', 'white--text', 'white--text'],
      };

      function setTheme(theme) {
        plugin.state.colors.value = colors[theme];
        plugin.state.textColors.value = textColors[theme];
      }
      return {
        state: plugin.state,
        colors,
        textColors,
        setTheme,
      };
    },
  };
</script>
