# SMART Web Messaging Demo EHR

> ✨ Bootstrapped with Create Snowpack App (CSA).

## User Instructions

### Profile Audience

This app was developed primarily for *App* developers wishing to test their implementation of SMART Web Messaging capabilities against a simple, demo EHR.

Embed your app into this demo EHR, initiate web messages to the EHR, and even modify the EHR responses before sending them back to your app!

## Preparing Your App

### Installing the Companion Library

There is a companion library that is distributed through `npm`.  Install it using the following command:

```bash
npm install --save swm-client-lib
```

### Using the Library

This library is currently an ES6 module *only*.  Import the module as shown in the example below:

```js
import * as swm from 'swm-client-lib';
```

### Configuration and Setup
To use the provided demo EHR, you must configure the EHR to use your app's web origin.  By default, the app uses `http://localhost:8001` as the app origin, but this configuration can be changed to your remote address.

After your app completes its SMART Launch, it should retain a handle on the SMART launch client, and provide it to the companion library when creating messages to send to the EHR.  The library expects the client to contain `smart_web_messaging_handle` and `smart_web_messaging_origin` parameters in the `tokenResponse` section of the client.

Here's an example from the demo React App that may be informative:
```js
import React, { useState } from 'react';
import './App.css';
import * as swm from 'swm-client-lib';  // npm -i swm-client-lib

const client = getSmartLaunchClient();  // hand-wavy bit here.

function App() {
  const [message, setMessage] = useState("{}");
  const [response, setResponse] = useState("");
...
  // Enable the postMessage API for EHR responses to the App.
  swm.enablePostMessage(targetOrigin, (response) => {
    setResponse(JSON.stringify(response, null, 2));
  });
...
  function stringify(message) {
    setMessage(JSON.stringify(message, null, 2));
  }

  function handshake() {
    stringify(swm.getHandshakeMessage(client));
  }

  function uiDone() {
    stringify(swm.getUiDoneMessage(client));
  }
...
  function sendMessage() {
    try {
      const m = JSON.parse(message);
      swm.checkMessageType(m);
      swm.sendMessage(client, m);
      setResponse('Awaiting EHR response...');
    } catch (e) {
      setResponse(e.message);
      console.error('failed to send message', e);
    }
  }
...
```

## User Interface
![image](https://user-images.githubusercontent.com/4342684/118538020-45e79a80-b713-11eb-878d-33f476ed02f3.png)

# Running the EHR Locally

## Available Scripts

### npm start

Runs the app in the development mode.
Open http://localhost:8080 to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### npm run build

Builds a static copy of your site to the `build/` folder.
Your app is ready to be deployed!

**For the best production performance:** Add a build bundler plugin like "@snowpack/plugin-webpack" to your `snowpack.config.js` config file.

### npm test

Launches the application test runner.
Run with the `--watch` flag (`npm test -- --watch`) to run in interactive watch mode.
