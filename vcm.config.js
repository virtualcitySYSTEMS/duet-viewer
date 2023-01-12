export default {
    // server.proxy see https://vitejs.dev/config/server-options.html#server-proxy
    proxy: {
      // string shorthand: http://localhost:8008/foo -> https://vc.systems/foo
      '/publish': 'https://services.citytwin.eu/app-receiver/gateway'
    },
    port: 8008
  }