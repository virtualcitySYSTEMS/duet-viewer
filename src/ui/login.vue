<template>
  <v-main>
    <v-container fluid fill-height fill-width>
      <v-layout align-center justify-center>
        <v-flex>
          <v-card class="elevation-2">
            <v-toolbar dark color="primary">
              <v-toolbar-title>{{ $t('login.login_title_form') }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-text-field
                v-model="username"
                name="username"
                :label="$t('login.login_username')"
                type="text"
                placeholder="username"
                required
              />
              <v-text-field
                v-model="password"
                name="password"
                :label="$t('login.login_password')"
                type="password"
                placeholder="password"
                required
              />
              <v-btn
                type="submit"
                class="mt-4"
                color="primary"
                value="log in"
                @click="doLogin()"
                :disabled="(username.length < 3 || password.length < 3)"
              >
                {{ $t('login.login_btn') }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-main>
</template>

<script>
  import { inject, ref } from 'vue';
  import {
    VContainer, VCard, VMain, VLayout, VFlex, VCardText, VTextField, VBtn, VToolbar, VToolbarTitle,
  } from 'vuetify/lib';
  import { loginToDuet } from '../duet-api/duetAPI.js';
  import dueterror from '../duet-api/errorlogging.js';

  export default {
    name: 'LoginComponent',
    components: {
      VContainer, VCard, VMain, VLayout, VFlex, VCardText, VTextField, VBtn, VToolbar, VToolbarTitle,
    },
    setup() {
      /** @type { import("@vcmap/ui").VcsUiApp } */
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('duetviewer');
      const { config } = plugin;
      const username = ref('');
      const password = ref('');
      function closeSelf() {
        app.windowManager.remove('Login');
      }
      async function doLogin() {
        const credentials = await loginToDuet(`${config.baseURL}/users/user-account/login`, username.value, password.value).catch((err) => {
          dueterror.addError({ function: 'login()', message: 'Login failed, please look at console for further information' }, 3);
          // eslint-disable-next-line no-console
          console.log(err);
        });
        if (credentials) {
          if (!credentials.status) {
            plugin.state.credentials.value = credentials;
            closeSelf();
            dueterror.addError({ function: 'login()', message: 'Login successful...' }, 1);
          } else {
            dueterror.addError({ function: 'login()', message: 'Login failed, please look at console for further information' }, 3);
          }
        } else {
          dueterror.addError({ function: 'login()', message: 'Login failed, please look at console for further information' }, 3);
        }
      }
      return {
        state: plugin.state,
        username,
        password,
        closeSelf,
        doLogin,
      };
    },
  };
</script>
