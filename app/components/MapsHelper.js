import * as http from "http";
import { Accuracy } from "ui/enums";
import * as platform from "tns-core-modules/platform";
import * as geolocation from "nativescript-geolocation";
import * as decodePolyline from "decode-google-map-polyline";
import { Position, Marker, Polyline, Bounds } from "nativescript-google-maps-sdk";

const MapsUIHelper = {
    data() {
        return {
            destinationMarker: new Marker(),
            myLocationMarker: new Marker(),
        }
    },
    methods: {
        enableMyLocationButton(value) {
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
        addMarkerToMap(marker, visibility, icon) {
            marker.position = Position.positionFromLatLng(0, 0);
            marker.draggable = true;
            marker.visible = visibility;
            if(icon !== undefined)
                marker.icon = icon;
            this.mapView.addMarker(marker);
        },
        setMarker(marker, lat, lng, direction) {
            marker.position = Position.positionFromLatLng(lat, lng);
            if (direction !== undefined)
                marker.rotation = direction;
        }
    }
};

const DirectionsAPIHelper = {
    data() {
        return {
            polyline: new Polyline(),
            routeCordinates: []
        }
    },
    methods: {
        async hitDirectionsAPI() {
            let APIURL = `https://maps.googleapis.com/maps/api/directions/json`;
            APIURL += `?origin=${this.origin.latitude},${this.origin.longitude}`;
            APIURL += `&destination=${this.destination.latitude},${this.destination.longitude}`;
            APIURL += `&key=${this.APIKEY}`;

            let promise = new Promise((resolve) => {

                http.getJSON(APIURL).then(
                    result => {
                        /* collect response */
                        let response = {
                            encodedPolylinePoints: result.routes[0].overview_polyline.points,
                            northEastBounds: result.routes[0].bounds.northeast,
                            southWestBounds: result.routes[0].bounds.southwest
                        };
                        resolve(response);
                    },
                    error => {
                        console.log(error);
                    }
                );
            });

            return await promise;
        },
        drawRoute(encodedPolylinePoints) {
            this.mapView.removeAllPolylines();
            this.routeCordinates = decodePolyline(encodedPolylinePoints);
            this.polyline = new Polyline();
            this.routeCordinates.forEach(point =>
                this.polyline.addPoint(Position.positionFromLatLng(point.lat, point.lng))
            );
            this.polyline.visible = true;
            this.polyline.geodesic = true;
            this.polyline.width = 7;
            this.mapView.addPolyline(this.polyline);
        },
        getRouteInView(northEast, southWest) {
            let bounds = Bounds.fromCoordinates(
                Position.positionFromLatLng(southWest.lat, southWest.lng),
                Position.positionFromLatLng(northEast.lat, northEast.lng)
            );
            this.mapView.setViewport(bounds,60);
        }
    }
};

const DistanceMatrixAPIHelper = {
    data() {
        return {
            distance: 0,
            duration: 0,
            destinationReached: false
        }
    },
    methods: {
        getDistance() {
            let distanceMatrixAPIURL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&";
            distanceMatrixAPIURL += `origins=${this.origin.latitude},${this.origin.longitude}&destinations=${this.destination.latitude},${this.destination.longitude}&key=${this.APIKEY}`;
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
            /* detect if user reached destination */
            if (distanceInMeters < 15) {
               /* cancel geolocation watch */
                this.endJourney();
                return;
            }
            this.journeyDetails = "Destination is " + this.distance + " away \n";
            this.journeyDetails += "Arrival Time is approximately: " + this.duration;
        }
    }
};


const LocationHelper = {
    data() {
        return {
            watch: null
        }
    },
    methods: {
        fetchMyLocation() {
            geolocation
                .getCurrentLocation({
                    desiredAccuracy: Accuracy.high,
                    maximumAge: 1000,
                    timeout: 20000
                })
                .then(res => {
                    this.origin.latitude = res.latitude;
                    this.origin.longitude = res.longitude;
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
                    this.origin.latitude = lat;
                    this.origin.longitude = lng;
                    /* bind live location to marker position & make marker always head towards the driving direction */
                    this.setMarker(this.myLocationMarker, lat, lng, res.direction);
                    /* update polyline after location changes */
                    this.getDirections();
                    /* calculate and display arrival time and distance on screen */
                    this.getDistance();
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
};

export default {
    MapsUIHelper,
    DirectionsAPIHelper,
    LocationHelper,
    DistanceMatrixAPIHelper
};