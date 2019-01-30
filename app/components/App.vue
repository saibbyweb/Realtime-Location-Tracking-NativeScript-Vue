
<template>
  <Page androidStatusBarBackground="#474747">
    <StackLayout>
      <WrapLayout horizontalAlignment="center">
        <Button @tap="getDirections">Get Directions</Button>
        <Button @tap="clearRoute">Clear Route</Button>
        <Button @tap="startJourney">Start Journey</Button>
        <button @tap="endJourney">End Journey</button>
      </WrapLayout>

      <DockLayout>
        <MapView
          dock="top"
          height="85%"
          width="100%"
          zoom="17"
          :latitude="this.origin.latitude"
          :longitude="this.origin.longitude"
          v-if="allowExecution"
        />
        <TextView dock="bottom" :text="journeyDetails" editable="false"/>
      </DockLayout>
    </StackLayout>
  </Page>
</template>

<script>
import * as permissions from "nativescript-permissions";
import * as platform from "platform";
import * as MapsHelper from "MapsHelper.js";

export default {
  mixins: [
    MapsHelper.DirectionsAPIHelper,
    MapsHelper.LocationHelper,
    MapsHelper.DistanceMatrixAPIHelper
  ],
  /* data object */
  data() {
    return {
      origin: { latitude: 0, longitude: 0 },
      journeyDetails: "details!!",
      allowExecution: false,
      mapView: null
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
        this.setCameraBounds(
          response.northEastBounds,
          response.southEastBounds
        );
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
      this.journeyDetails = "Destination Reached."
    }
  }
};
</script>

<style>
button {
  font-size: 9;
  background-color: #474747;
  color: white;
  width: 25%;
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