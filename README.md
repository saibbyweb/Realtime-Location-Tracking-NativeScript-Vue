# A Cross Platform, Real-time Location Tracking app made with NativeScript-Vue under 350 lines of code

## Prerequisites

 1) Obtain a key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview) having access to the following APIs:

    - [Maps SDK for Android](https://developers.google.com/maps/documentation/android-sdk/intro) 
    - [Maps SDK for iOS](https://developers.google.com/maps/documentation/ios-sdk/get-api-key)
    - [Directions API](https://developers.google.com/maps/documentation/directions/start)
    - [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/get-api-key)

> Google Cloud Console will ask you to create a project before you can gain access to the APIs. Once you have created a project and a key is issued for an API, subsequent enabled APIs will be accessible using the same key which was issued for the first one. That means, the 4 APIs listed above can have one single key if falling under the same project, which exactly is the case with this app.

 2) Setup your machine to compile apps as communicated in this [Nativescript-Vue Installation Manual](https://nativescript-vue.org/en/docs/getting-started/installation/)




## Usage

``` bash
# Install dependencies
npm install

# Build for production
tns build <platform> --bundle

# Build, watch for changes and debug the application
tns debug <platform> --bundle

# Build, watch for changes and run the application
tns run <platform> --bundle
```
