import {
    Position,
    Marker
} from "nativescript-google-maps-sdk";
import * as geolocation from "nativescript-geolocation";
import {
    Accuracy
} from "ui/enums";
import * as mapsModule from "nativescript-google-maps-sdk";
const decodePolyline = require("decode-google-map-polyline");
import * as http from "http";
import * as platform from "tns-core-modules/platform";

import {
    TWEEN
} from "nativescript-tweenjs";

const DirectionsAPIHelper = {
    data() {
        return {
            origin: {
                latitude: 0,
                longitude: 0
            },
            destination: {
                latitude: 0,
                longitude: 0
            },
            northEastBounds: {},
            southWestBounds: {},
            polyline: null,
            encodedPolyline: null,
            routeCordinates: [],
            APIKEY: "AIzaSyCeXREu81qPlViAQ0eiy2FrnfyutxxsTo8",
            journeyStarted: false
        }
    },
    methods: {
        setBounds(neBounds, swBounds) {
            this.northEastBounds.lat = neBounds.lat;
            this.northEastBounds.lng = neBounds.lng;
            this.southWestBounds.lat = swBounds.lat;
            this.southWestBounds.lng = swBounds.lng;
        },
        getDirections() {
            let originCordinates = this.origin.latitude + "," + this.origin.longitude;
            let destinationCordinates =
                this.destination.latitude + "," + this.destination.longitude;
            let APIURL =
                "https://maps.googleapis.com/maps/api/directions/json?origin=" +
                originCordinates +
                "&destination=" +
                destinationCordinates +
                "&key=" +
                this.APIKEY;
            http.getJSON(APIURL).then(
                result => {
                    this.encodedPolyline = result.routes[0].overview_polyline.points;
                    this.routeCordinates = decodePolyline(this.encodedPolyline);
                    this.setBounds(result.routes[0].bounds.northeast, result.routes[0].bounds.southwest);
                    this.drawRoute();
                },
                error => {
                    console.log(error);
                }
            );
        },
        drawRoute() {
            this.mapView.removeAllPolylines();
            this.polyline = new mapsModule.Polyline();
            this.mapView.addPolyline(this.polyline);
            this.routeCordinates.forEach(point =>
                this.polyline.addPoint(
                    Position.positionFromLatLng(point.lat, point.lng)
                )
            );
            this.polyline.visible = true;
            this.polyline.geodesic = true;
            this.polyline.width = 10;
            if (!this.journeyStarted)
                this.animateCamera();
        },
        animateCamera() {
            if (platform.isAndroid) {
                let builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();
                let position1 = new com.google.android.gms.maps.model.LatLng(
                    this.northEastBounds.lat,
                    this.northEastBounds.lng
                );
                let position2 = new com.google.android.gms.maps.model.LatLng(
                    this.southWestBounds.lat,
                    this.southWestBounds.lng
                );
                builder.include(position1);
                builder.include(position2);
                let bounds = builder.build();
                let padding = 150;
                let cu = com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(
                    bounds,
                    padding
                );
                this.mapView.gMap.animateCamera(cu, 1000, null);
            } else {
                let bounds = GMSCoordinateBounds.alloc().init();
                let position1 = CLLocationCoordinate2DMake(
                    this.northEastBounds.lat,
                    this.northEastBounds.lng
                );
                let position2 = CLLocationCoordinate2DMake(
                    this.southWestBounds.lat,
                    this.southWestBounds.lng
                );
                bounds = bounds.includingCoordinate(position1);
                bounds = bounds.includingCoordinate(position2);
                let update = GMSCameraUpdate.fitBoundsWithPadding(bounds, 100);
                this.mapView.gMap.animateWithCameraUpdate(update);
            }
        }
    }
}

const LocationHelper = {
    data() {
        return {
            destinationMarker: new Marker(),
            myLocationMarker: new Marker(),
            watch: null
        }
    },
    methods: {
        turnOnMyLocation(value) {
            /* enable compass (enabled by default on android */
            this.mapView.settings.compassEnabled = value;
            if (platform.isAndroid) {
                let uiSettings = this.mapView.gMap.getUiSettings();
                uiSettings.setMyLocationButtonEnabled(value);
                /* enable my location button on android */
                this.mapView.gMap.setMyLocationEnabled(value);
            } else {
                /* enable my location button on iOS */
                this.mapView.gMap.myLocationEnabled = value;
                this.mapView.gMap.settings.myLocationButton = value;
            }
        },
        addMarkerToMap(marker, car) {
            car ? (marker.icon = "redcar") : console.log('Simple Marker');
            marker.position = Position.positionFromLatLng(0, 0);
            this.mapView.addMarker(marker);
            marker.draggable = true;
        },
        setMarker(marker, lat, lng, heading) {
            // marker.position = Position.positionFromLatLng(lat, lng);

            new TWEEN.Tween(marker.position)
            .to({ latitude: lat, longitude: lng }, 1000)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(object => {
              marker.position = Position.positionFromLatLng(
                object.latitude,
                object.longitude
              );
            })
            .start();
            this.logData+= "\n " + heading;

            // heading ? (marker.rotation = heading) : console.log('No need to rotate marker');
            if(heading) {
                this.logData+= "\n " + heading;
                marker.rotation = heading;
            }
        },
        fetchLocation() {
            geolocation
                .getCurrentLocation({
                    desiredAccuracy: Accuracy.high,
                    maximumAge: 1000,
                    timeout: 20000
                })
                .then(res => {
                    let lat = res.latitude;
                    let lng = res.longitude;

                    this.origin.latitude = lat;
                    this.origin.longitude = lng;

                })
                .catch(e => {
                    console.log("oh frak, error", e);
                });
        },
        watchLocationAndUpdateJourney() {
            this.watch = geolocation.watchLocation(
                res => {
                    let lat = res.latitude;
                    let lng = res.longitude;
                    /* needs to check */
                    let heading = res.direction;
                    this.origin.latitude = lat;
                    this.origin.longitude = lng;

                    /* bind live location to marker position & make marker always head towards the driving direction */
                    this.setMarker(this.myLocationMarker, lat, lng, heading);
                    /* update polyline after location changes */
                    this.getDirections();
                    /* calculate and display arrival time and distance on screen */
                    this.getDistance();
                    /* detect when user reaches destination and cancel geolocation watch */
                },
                error => console.log(error), {
                    desiredAccuracy: Accuracy.high,
                    updateDistance: 1,
                    updateTime: 3000,
                    minimumUpdateTime: 3000
                }
            );
        },
        clearWatch() {
            geolocation.clearWatch(this.watch);
        }
    }
}

const DistanceMatrixAPIHelper = {
    data() {
        return {
            DMAPIKEY: "AIzaSyAPw4owHD6nyUOMGQDI1pzyaELFndKXUe8",
            distance: 999,
            duration: 999,
            journeyDetails: "",
            destinationReached: false
        }
    },
    methods: {
        getDistance() {
            let distanceMatrixAPIURL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&";
            distanceMatrixAPIURL += `origins=${this.origin.latitude},${this.origin.longitude}&destinations=${this.destination.latitude},${this.destination.longitude}&key=${this.DMAPIKEY}`;
            console.log(distanceMatrixAPIURL);
            http.getJSON(distanceMatrixAPIURL).then(
                result => {
                    this.distance = result.rows[0].elements[0].distance.text;
                    this.duration = result.rows[0].elements[0].duration.text;
                    this.updateJourneyDetails(result.rows[0].elements[0].distance.value);
                },
                error => {
                    console.log(error);
                }
            );

        },
        updateJourneyDetails(distanceInMeters) {
            if(distanceInMeters < 15) {
                this.destinationReached = true;
                this.endJourney();
                console.log('journey ended');
                return;
            }

            let details = "Destination is " + this.distance + " away \n";
            details += "Arrival Time is approximately: " + this.duration;
            this.journeyDetails = details;
        }
    }
}

const MapsHelper = {
    DirectionsAPIHelper,
    LocationHelper,
    DistanceMatrixAPIHelper
}
export default MapsHelper;