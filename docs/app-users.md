# SMART Web Messaging Demo App

## User Instructions

### Profile Audience

This app was developed primarily for *EHR* developers wishing to test their implementation of SMART Web Messaging against a simple demo app.

Embed this app into your EHR to initiate web messages to the EHR, and view the returned responses.

## Preparing Your EHR

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

### Session `messagingHandle` Management

Within your EHR, you will need to create an `iframe` element to embed the app - or launch the app in a new tab.  This demo assumes an embedded application, but either should work with the provided library.

The provided demo EHR was designed to map a session `messagingHandle` to the `iframe` `contentWindow` object itself, which is recorded automatically when the `iframe` finishes loading.  Your EHR may have different capabilities and requirements, but whatever strategy you employ, the `smart_web_messaging_handle` launch context parameter *must* be provided in the SMART Launch client object, and it *must be* provided to the EHR (and validated against the session) *in all messages* in order to be within IG specifications.

Here's an example from the mock EHR React app that may be informative:

```js
import React, { useState } from 'react';
import './Ehr.css';
import * as swm from 'swm-client-lib';

// Each loaded iframe maps a session handle to a window object.
// This is just *one* way to do this - your implementation details may vary.
const sessionHandles = new Map();
...
function Ehr() {
...
  const [appOrigin, setAppOrigin] = useState('http://localhost:8001');
  const [sessionHandle, setSessionHandle] = useState('RXhhbXBsZSBoYW5kbGUK');

  // Enable the postMessage API for receiving App messages in the EHR.
  swm.enablePostMessage(appOrigin, (m) => {
    // Handle the message received from the app.
...
  });

  // Note: this was slightly modified from the actual code for simplicity.
  function sendResponse(response) {
    try {
      swm.checkMessageType(response);  // sanity check response before sending it
      const window = sessionHandles.get(message.messagingHandle);
      if (!window) {
        console.error('Unknown session handle', sessionHandle);
      }
      swm.sendResponse(window, response, appOrigin);
    } catch (e) {
      console.error('failed to send message', e);
    }
  }

  return (
...
    <div className="Embedded-app">
      <iframe
        id="app-iframe"
        src={appOrigin}
        allow="clipboard-write"
        onLoad={() => {
          sessionHandles.set(
            sessionHandle, 
            document.getElementById('app-iframe').contentWindow
          )
        }}
      ></iframe>
    </div>
...
  );
```

## User Interface

![image](https://user-images.githubusercontent.com/4342684/118530733-98708900-b70a-11eb-920c-60b8609a1592.png)
