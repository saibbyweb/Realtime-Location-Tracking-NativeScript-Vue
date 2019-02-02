
<template>
  <Page androidStatusBarBackground="#474747">
    <ActionBar title="Realtime Location NSVUE"/>
    <StackLayout>
      <WrapLayout horizontalAlignment="center">
        <Button @tap="getDirections">Get Directions</Button>
        <Button @tap="clearRoute">Clear Route</Button>
        <Button @tap="startJourney">Start Journey</Button>
        <button @tap="endJourney">End Journey</button>
      </WrapLayout>

      <DockLayout>
        <MapView
          width="100%"
          height="85%"
          dock="top"
          :zoom="zoom"
          :latitude="origin.latitude"
          :longitude="origin.longitude"
          v-if="allowExecution"
          @mapReady="mapReady"
          @coordinateLongPress="locationSelected"
          mapAnimationsEnabled="true"
        />
        <TextView dock="bottom" :text="journeyDetails" editable="false"/>
      </DockLayout>
    </StackLayout>
  </Page>
</template>

<script>
import * as permissions from "nativescript-permissions";
import * as platform from "platform";
import MapsHelper from "./MapsHelper.js";

export default {
  mixins: [
    MapsHelper.MapsUIHelper,
    MapsHelper.DirectionsAPIHelper,
    MapsHelper.LocationHelper,
    MapsHelper.DistanceMatrixAPIHelper
  ],
  /* data object */
  data() {
    return {
      origin: { latitude: 0, longitude: 0 },
      destination: { latitude: 0, longitude: 0 },
      journeyDetails: "Journey: Not started yet!",
      allowExecution: false,
      mapView: null,
      zoom: 17,
      APIKEY: "AIzaSyAPw4owHD6nyUOMGQDI1pzyaELFndKXUe8"
    };
  },
  created: function() {
    /* dont run the android permissions routine for iOS */
    if (platform.isIOS) {
      this.allowExecution = true;
      return;
    }
    /* list of permissions needed */
    let permissionsNeeded = [
      android.Manifest.permission.ACCESS_FINE_LOCATION,
      android.Manifest.permission.ACCESS_COARSE_LOCATION
    ];
    /* showing up permissions dialog */
    permissions
      .requestPermissions(permissionsNeeded, "Give it to me!")
      .then(() => (this.allowExecution = true))
      .catch(() => (this.allowExecution = false));
  },
  methods: {
    mapReady(args) {
      /* get the mapView instance */
      this.mapView = args.object;

      /* ios map center bug fix */
      setTimeout(() => {
        this.mapView.height = {
          unit: this.mapView.height.unit,
          value: this.mapView.height.value + 0.0004
        };
      }, 100);

      this.mapView.mapAnimationsEnabled = true;
      /* turn on my location button on map */
      this.enableMyLocationButton(true);
      /* add destination marker to map */
      this.addMarkerToMap(this.destinationMarker, true);
      /* add car marker to map (which will point to our location when journey starts) - visibility hidden  */
      this.addMarkerToMap(this.carMarker, false);
      /* set map origin coordinates to present device location */
      this.fetchMyLocation();
    },
    locationSelected(args) {
      /* get coordinates of the point where user long pressed */
      let lat = args.position.latitude;
      let lng = args.position.longitude;
      /* set the obtained coordinates as the destination coordinates */
      this.destination.latitude = lat;
      this.destination.longitude = lng;
      /* move the destination marker to the same coordinates */
      this.setMarker(this.destinationMarker, lat, lng);
    },
    getDirections() {
      /* hit Directions API - as origin and destination coordinates are set */
      this.hitDirectionsAPI().then(response => {
        /* draw route from encoded polyline points */
        this.drawRoute(response.encodedPolylinePoints);
        /* adjust camera to bring route into view */
        this.getRouteInView(response.northEastBounds, response.southWestBounds);
      });
    },
    clearRoute() {
      /* remove the route drawn between locations on map */
      this.mapView.removeAllPolylines();
    },
    startJourney() {
      /* hide my location indicator and button */
      this.enableMyLocationButton(false);
      /* un-hide the car marker */
      this.carMarker.visible = true;
      /* update journey details */
      this.journeyDetails = "Journey started...";
      /* start watching for location changes and update the map and journey details accordingly */
      this.watchLocationAndUpdateJourney();
    },
    endJourney() {
      /* stop watching for location changes */
      this.clearWatch();
      /* remove the route drawn on map */
      this.clearRoute();
      /* hide the car marker  */
      this.carMarker.visible = false;
      /* bring back my location button on screen */
      this.enableMyLocationButton(true);
      /* update journey details */
      this.journeyDetails = "Destination Reached.";
    }
  }
};
</script>

<style>
button {
  font-size: 9;
  background-color: #474747;
  color: white;
  width: 23%;
  height: 60;
}
ActionBar {
  background-color: #474747;
  color: white;
}
Page {
  background-color: #474747;
}
TextView {
  border-bottom-color: transparent;
  color: white;
  border-bottom-width: 1;
  padding: 15;
}
</style>