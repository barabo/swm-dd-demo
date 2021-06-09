# SMART Web Messaging Demo EHR

A simple, mock EHR that can be used to test SMART Web Messaging capable apps.

![image](https://user-images.githubusercontent.com/4342684/121296318-1103d900-c8b6-11eb-8e12-79cdc2fd0d31.png)

[CLICK HERE](https://barabo.github.io/swm-dd-demo/ehr/) to launch it, or visit: [https://barabo.github.io/swm-dd-demo/ehr/](https://barabo.github.io/swm-dd-demo/ehr/)

## User Instructions

### Profile Audience

This simple, mock EHR was developed primarily for *App* developers wishing to test their implementation of SMART Web Messaging capabilities against a simple, demo EHR.

Embed your app into this demo EHR, initiate web messages to the EHR, and even modify the EHR responses before sending them back to your app!

## Preparing Your App

### Installing the Companion Library

There is a companion library that is distributed through `npm`.  The full documentation is [here](https://github.com/barabo/swm-dd-demo/tree/main/lib#smart-web-messaging-client-library).

Install it using the following command:

```bash
npm install --save swm-client-lib
```

### Using the Library

This library is currently an ES6 module *only*.  Import the module as shown in the example below:

```js
import * as swm from 'swm-client-lib';
```

### Configuration and Setup

Refer to the [client library documentation](https://github.com/barabo/swm-dd-demo/tree/main/lib#smart-web-messaging-client-library) for full instructions, including some of the concepts behind using the library to enable SMART Web Messaging in your app.

Link: [https://github.com/barabo/swm-dd-demo/tree/main/lib](https://github.com/barabo/swm-dd-demo/tree/main/lib#smart-web-messaging-client-library)

## User Interface

![image](https://user-images.githubusercontent.com/4342684/121296693-ae5f0d00-c8b6-11eb-8ac3-916870280a13.png)

The mock EHR features two panels.  The left panel displays the most recent message received from your app.  The right panel is automatically populated with a
possible response to the received message, which mostly based on the received `messageType`.  You can edit this response before sending it to your app, or select one of the template responses in the 'Insert a response...' dropdown.

### EHR Configuration

![image](https://user-images.githubusercontent.com/4342684/121297214-99cf4480-c8b7-11eb-91bb-477ba069b548.png)

Click the configure button in the upper right corner to enter your app URL.

Make sure your app is configured to use the value shown in the Session Handle, or messages from your app will be ignored by the Mock EHR!

### EHR Scratchpad

![image](https://user-images.githubusercontent.com/4342684/121297695-54f7dd80-c8b8-11eb-8152-ca116607e006.png)

Your app can create, read, update, and delete entries in the EHR scratchpad.  Click the Scratchpad button to hide and reveal the scratchpad contents.
