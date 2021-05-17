import React, { useState } from 'react';
import './Ehr.css';
import * as swm from './swm';

/**
 * Maps scratchpad 'locations' to objects.
 * TODO: does an update to this trigger a refresh?
 */
const scratchpad = new Map();
const resourceIds = new Map();
const sessionHandles = new Map();
// map the session handles to the window object?

/**
 * @returns The contents of the EHR scratchpad.
 */
function getScratchpad() {
  return [...scratchpad.values()];
}

function Ehr() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('{}');
  const [messageFromApp, setMessageFromApp] = useState('');
  // TODO: enable changing the appOrigin and sessionHandle from the UI.
  const [appOrigin, setAppOrigin] = useState('http://localhost:8001');
  const [sessionHandle, setSessionHandle] = useState('RXhhbXBsZSBoYW5kbGUK');

  // Enable the postMessage API for App messages to the EHR.
  swm.enablePostMessage(appOrigin, (m) => {
    setResponse('');
    setMessage(m);
    setMessageFromApp(JSON.stringify(m, null, 2));
    // TODO: disable all the buttons upon receipt of a valid message??
    // BONUS: highlight and enable only the button for the expected response type
    // TODO: check the message handle for a known session handle?
  });

  function updateResponse(e) {
    // TODO: validate the message structure to expose problems with it.
    // TODO: only enable the SEND button when the e.target.value is valid.
    setResponse(e.target.value);
  }

  function stringify(message) {
    setResponse(JSON.stringify(message, null, 2));
  }

  function handshake() {
    // TODO: insert the session handle into sessionHandles here???
    stringify(swm.getHandshakeResponse(message.messageId));
  }

  function uiDone() {
    stringify(swm.getUiDoneResponse(
      message.messageId, 'success', 'EHR hid the app iframe'
    ));
  }

  function uiLaunchActivity() {
    stringify(
      swm.getUiLaunchActivityResponse(
        message.messageId,
        'success',
        `EHR completed activity "${message.payload.activityType}"`
      )
    );
  }

  function scratchpadCreate() {
    const resourceType = message.payload.resource.resourceType;
    const id = 1 + (resourceIds.get(resourceType) || 0);
    resourceIds.set(resourceType, id);
    const location = `${resourceType}/${id}`;
    const outcome = undefined;  // TODO: populate an OperationOutcome
    stringify(
      swm.getScratchpadCreateResponse(
        message.messageId, '200 OK', location, outcome
      )
    );
  }

  function scratchpadDelete() {
    const location = message.payload && message.payload.location || '';
    const status = scratchpad.has(location) && '200 OK' || '404 NOT FOUND';
    const outcome = undefined;  // TODO: add an OperationOutcome
    stringify(swm.getScratchpadDeleteResponse(
      message.messageId, status, outcome
    ));
  }

  function scratchpadUpdate() {
    const location = message.payload && message.payload.location || '';
    const status = scratchpad.has(location) && '200 OK' || '404 NOT FOUND';
    const outcome = undefined;  // TODO: add an OperationOutcome
    stringify(
      swm.getScratchpadUpdateResponse(
        message.messageId, status, location, outcome
      )
    );
  }

  function copyResponseToClipboard() {
    // This only works in Chrome when the iframe explicitly allows
    // clipboard write access via <iframe allow="clipboard-write" ...
    navigator.clipboard.writeText(messageFromApp);
  }

  function sendResponse() {
    try {
      const r = JSON.parse(response);
      const type = Object.prototype.toString.call(r);
      const expected = Object.prototype.toString.call({});
      if (type !== expected) {
        throw new Error(
          `Invalid message type: expected "${expected}", got "${type}"!`
        );
      }
      const window = sessionHandles.get(message.messagingHandle);
      if (!window) {
        console.error('Unknown session handle', sessionHandle);
      }
      swm.sendResponse(window, r, appOrigin);
    } catch (e) {
      console.error('failed to send message', e);
    }
  }

  return (
    <div className="Ehr">
      <header className="Ehr-header">
        <p>
          Mock EHR
          &nbsp;
          <a 
            target="_blank"
            rel="noreferrer noopener"
            href="https://build.fhir.org/ig/HL7/smart-web-messaging/"
          >SMART Web Messaging</a>
          &nbsp;
          Demo App
        </p>
      </header>
      <main className="Site-content">
        <div className="Ehr-buttons">
          <p>Prepopulate response message below for the incoming</p>
          <button onClick={handshake}>status.handshake</button>
          <button onClick={uiDone}>ui.done</button>
          <button onClick={uiLaunchActivity}>ui.launchActivity</button>
          <button onClick={scratchpadCreate}>scratchpad.create</button>
          <button onClick={scratchpadUpdate}>scratchpad.update</button>
          <button onClick={scratchpadDelete}>scratchpad.delete</button>
        </div>
        <div className="message-panel">
          <div className="from-app">
            <p><b><i>Read-only</i></b> SMART Web Message <i>received</i> from App:</p>
            <textarea
              disabled
              className="App-message"
              value={messageFromApp}
              readOnly={true}
            />
            <button
              className="copy-response"
              onClick={copyResponseToClipboard}
            >Copy to clipboard</button>
          </div>
          <div className="to-send">
            <p><b><i>Editable</i></b> SMART Web Message <i>response</i> to send to App:</p>
            <textarea
              id="responseText"
              className="App-message"
              value={response}
              onChange={updateResponse}
            />
            <button
              className="send-button"
              onClick={sendResponse}
              disabled={false}
            >SEND</button>
          </div>
        </div>
        <div className="Ehr-scratchpad">
          <p>EHR scratchpad</p>
          <pre id="scratchpad">{
            JSON.stringify(getScratchpad(), null, 2)
          }</pre>
        </div>
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
      </main>
      <footer className="Ehr-footer">
        <p>
          EHR Footer
        </p>
      </footer>
    </div>
  );
}

export default Ehr;
