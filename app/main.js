import Vue from 'nativescript-vue'
import App from './components/App'
import * as platform from "platform"
import * as permissions from 'nativescript-permissions'

if (platform.isIOS)
  GMSServices.provideAPIKey("AIzaSyAPw4owHD6nyUOMGQDI1pzyaELFndKXUe8")

/* registering MapView element */
Vue.registerElement('MapView', () => require('nativescript-google-maps-sdk').MapView)

new Vue({
  data() {
    return {
      allowExecution: false
    }
  },
  created: () => {
    /* list of permissions needed */
    let permissionsNeeded = [android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION]
    /* showing up permissions dialog */
    permissions.requestPermissions(permissionsNeeded, "I need these permissions because I'm cool")
      .then(() => this.allowExecution = true)
      .catch(() => this.allowExecution = false)
  },
  render: h => h('frame', [h(App)]),
}).$start()