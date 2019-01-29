
<template>
  <Page androidStatusBarBackground="#474747">
    <StackLayout>
      <WrapLayout horizontalAlignment="center">
        <!-- <Button @tap="getDirections">Get Directions</Button> -->
        <!-- <Button @tap="clearRoute">Clear Route</Button> -->
        <!-- <Button @tap="startJourney">Start Journey</Button> -->
        <!-- <button @tap="endJourney">End Journey</button> -->
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

export default {
  /* data object */
  data() {
    return {
      origin: { latitude: 0, longitude: 0 },
      allowExecution: false,
      journeyDetails: "details!!",
      mapView: null
    };
  },
  created: function() {
    /* dont run the android permissions code for iOS */
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
      .then(() => {
        this.allowExecution = true;
      })
      .catch(() => {
        this.allowExecution = false;
      });
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
