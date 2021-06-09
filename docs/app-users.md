# SMART Web Messaging Demo App

A simple, EHR-embeddable app that can be used to test an EHR's implementation of SMART Web Messaging capabilities.

![image](https://user-images.githubusercontent.com/4342684/121302968-182fe480-c8c0-11eb-927f-f4b96bd25508.png)

[CLICK HERE](https://barabo.github.io/swm-dd-demo/app/) to launch it, or visit: [https://barabo.github.io/swm-dd-demo/app/](https://barabo.github.io/swm-dd-demo/app/)

## User Instructions

### Profile Audience

This app was developed primarily for *EHR* developers wishing to test their implementation of SMART Web Messaging against a simple demo app.

Embed this app into your EHR and use it to initiate web messages, quickly viewing the returned responses.

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

### Client Configuration and Setup

Refer to the [client library documentation](https://github.com/barabo/swm-dd-demo/tree/main/lib#smart-web-messaging-client-library) for full instructions, including some of the concepts behind using the library to enable SMART Web Messaging in your EHR.

Link: [https://github.com/barabo/swm-dd-demo/tree/main/lib](https://github.com/barabo/swm-dd-demo/tree/main/lib#smart-web-messaging-client-library)

### Session `messagingHandle` Management

Within your EHR, you will need to create an `iframe` element to embed the app - or launch the app in a new tab.  This demo assumes an embedded application, but either should work with the provided library.

The provided demo EHR was designed to map a session `messagingHandle` to the `iframe` `contentWindow` object itself, which is recorded automatically when the `iframe` finishes loading.  Your EHR may have different capabilities and requirements, but whatever strategy you employ, the `smart_web_messaging_handle` launch context parameter *must* be provided in the SMART Launch client object, and it *must be* provided to the EHR (and validated against the session) *in all messages* in order to be within IG specifications.

## User Interface

![image](https://user-images.githubusercontent.com/4342684/121302929-09493200-c8c0-11eb-8508-207c3b9e69da.png)

Like the [Mock EHR](https://barabo.github.io/swm-dd-demo/ehr-users.html#user-interface), the demo app provides two message panels.  The left panel is *editable* and contains a message that can be sent to the EHR.  The panel on the right contains the read-only response from the EHR.

### App Configuration

![image](https://user-images.githubusercontent.com/4342684/121304936-9ab9a380-c8c2-11eb-9866-dbeb0cca7cdd.png)

Messages sent from the app to your EHR must specify the target origin of your EHR in order for the browser to deliver them.  The client library requires a
correct target origin parameter, as well, and the value used in the app configuration panel must be set.

**Also, the messaging handle shown in the configuration panel should match what the EHR expects from the app session messages.**

### Sending Messages

![image](https://user-images.githubusercontent.com/4342684/121305712-8a55f880-c8c3-11eb-8db1-2f69a84ae726.png)

Within your EHR, you will need to create an `iframe` element to embed the app - or launch the app in a new tab.  This demo assumes an embedded application, but either should work with the provided library.

![image](https://user-images.githubusercontent.com/4342684/121306129-19631080-c8c4-11eb-99ab-220cb4d32201.png)

Select any of the available template messages and edit them according to your needs before sending.
