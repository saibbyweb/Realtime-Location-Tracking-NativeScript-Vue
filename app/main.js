import Vue from 'nativescript-vue'
import App from './components/App'
import * as platform from 'platform'

Vue.config.silent = (TNS_ENV === 'production')

if (platform.isIOS)
  GMSServices.provideAPIKey("AIzaSyAPw4owHD6nyUOMGQDI1pzyaELFndKXUe8")

/* registering MapView element */
Vue.registerElement('MapView', () => require('nativescript-google-maps-sdk').MapView)

new Vue({
  render: h => h('frame', [h(App)]),
}).$start()