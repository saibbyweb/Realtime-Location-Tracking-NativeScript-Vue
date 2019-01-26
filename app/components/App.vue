<template>
  <Page>
    <StackLayout>
      <WrapLayout top="0" left="0" itemWidth="70">
        <Button @tap="getDirections">Get Directions</Button>
        <Button @tap="clearRoute">Clear Route</Button>
        <Button @tap="startJourney">Start Journey</Button>
        <button @tap="endJourney">End Journey</button>
      </WrapLayout>
      <AbsoluteLayout>
        <MapView
          top="0"
          left="0"
          height="100%"
          width="100%"
          zoom="17"
          :latitude="this.origin.latitude"
          :longitude="this.origin.longitude"
          @mapReady="mapReady"
          @coordinateLongPress="locationSelected"
        />
        <TextView top="0" left="10" v-model="journeyDetails" v-if="journeyStarted"/>
        <TextView top="100" left="10" text="Destination Reached." v-if="destinationReached"/>
      </AbsoluteLayout>
    </StackLayout>
  </Page>
</template>

<script>
export default {
    data() {
        return {
            origin: {latitude: 0, longitude: 0}
        }
    },
    methods: {
        mapReady(args) {
          console.log(this.$parent)
        },
        locationSelected(args) {
            
        }
    }
}
</script>