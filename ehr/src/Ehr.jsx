import React, { useCallback, useEffect, useState } from 'react';
import './Ehr.css';
import * as swm from './swm'; // XXX local dev only TEMPORARY
//import * as swm from 'swm-client-lib';  // npm i -s swm-client-lib

//const defaultAppUrl = 'https://barabo.github.io/swm-c10n-demo/app/';
const defaultAppUrl = 'http://localhost:8001/app/';
const defaultAppOrigin = new URL(defaultAppUrl).origin;
const defaultSessionHandle = 'RXhhbXBsZSBoYW5kbGUK';

/**
 * Maps ResourceTypes to the last known int ID used for that type.  This helps
 * guarantee that a scratchpad.create message does not collide with an existing
 * Resource in the scratchpad.
 */
const resourceIds = new Map();

/**
 * Maps the iframe sessionHandle to the app contentWindow object.
 */
const sessionHandles = new Map();

function Ehr() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('{}');
  const [messageFromApp, setMessageFromApp] = useState('');
  const [appUrl, setAppUrl] = useState(defaultAppUrl);
  const [appOrigin, setAppOrigin] = useState(defaultAppOrigin);
  const [sessionHandle, setSessionHandle] = useState(defaultSessionHandle);
  const [scratchpad, setScratchpad] = useState(new Map());

  // Enable the postMessage API for App messages to the EHR.
  const init = useCallback(() => {
    swm.enablePostMessage(appOrigin, (m) => {
      // Only respond to messages with recognized messaging handles.
      if (sessionHandles.has(m.messagingHandle)) {
        setResponse('');
        setMessage(m);
        setMessageFromApp(JSON.stringify(m, null, 2));
        // TODO: disable all the buttons upon receipt of a valid message??
        // BONUS: highlight and enable only the button for the expected response type
      } else if (m.messagingHandle) {
        console.error(`Unknown messaging handle: ${m.messagingHandle}`);
      }
    });
  }, [appOrigin, sessionHandle]);
  useEffect(init, [init]);

  function openConfig() {
    document.getElementById('config-panel').showModal();
  }

  function updateSessionHandle(e) {
    setSessionHandle(e.target.value);
  }

  function updateAppUrl(e) {
    const url = e.target.value;
    setAppUrl(url);
    try {
      if (new URL(url).origin !== appOrigin) {
        setAppOrigin(new URL(url).origin);
      }
    } catch {
      // Ignore
    }
  }

  function closeConfig() {
    document.getElementById('config-panel').close();
  }

  function updateResponse(e) {
    // TODO: validate the message structure to expose problems with it.
    // TODO: only enable the SEND button when the e.target.value is valid.
    setResponse(e.target.value);
  }

  function prepopulate(message) {
    setResponse(JSON.stringify(message, null, 2));
  }

  function getHandshakeResponse() {
    return swm.getHandshakeResponse(message.messageId);
  }

  function getUiDoneResponse() {
    return swm.getUiDoneResponse(
      message.messageId,
      'success',
      'EHR hid the app iframe',
    );
  }

  function getUiLaunchActivityResponse() {
    const activity = message?.payload?.activityType;
    if (!activity) {
      console.error('Missing activityType from message', message);
    }
    return swm.getUiLaunchActivityResponse(
      message.messageId,
      'success',
      `EHR completed activity "${activity}"`,
    );
  }

  function getScratchpadCreateResponse() {
    const resourceType = message.payload?.resource?.resourceType;
    if (!resourceType) {
      console.error('Unknown resourceType', message);
    }
    const id = 1 + (resourceIds.get(resourceType) || 0);
    resourceIds.set(resourceType, id);
    const location = `${resourceType}/${id}`;
    const outcome = undefined; // TODO: populate an OperationOutcome
    return swm.getScratchpadCreateResponse(
      message.messageId,
      '200 OK',
      location,
      outcome,
    );
  }

  function getScratchpadDeleteResponse() {
    const location = message?.payload?.location ?? 'Encounter/123';
    const status = (scratchpad.has(location) && '200 OK') || '404 NOT FOUND';
    const outcome = undefined; // TODO: add an OperationOutcome
    return swm.getScratchpadDeleteResponse(message.messageId, status, outcome);
  }

  function getScratchpadUpdateResponse() {
    const location = message?.payload?.location ?? 'Encounter/123';
    const status = (scratchpad.has(location) && '200 OK') || '404 NOT FOUND';
    const outcome = undefined; // TODO: add an OperationOutcome
    return swm.getScratchpadUpdateResponse(
      message.messageId,
      status,
      location,
      outcome,
    );
  }

  function copyResponseToClipboard() {
    // This only works in Chrome when the iframe explicitly allows
    // clipboard write access via <iframe allow="clipboard-write" ...
    navigator.clipboard.writeText(messageFromApp);
  }

  function isResponseSendable() {
    if (!message || !response) {
      return false;
    }
    const r = JSON.parse(response);
    if (!r.responseToMessageId) {
      return false;
    }
    return true;
  }

  function sendResponse() {
    try {
      const r = JSON.parse(response);
      swm.checkMessageType(r);
      const window = sessionHandles.get(message.messagingHandle);
      if (!window) {
        console.error('Unknown session handle', sessionHandle);
      }
      swm.sendResponse(window, r, appOrigin);
    } catch (e) {
      console.error('failed to send message', e);
    }
  }

  function applyScratchpadMessage() {
    if (!message || !message.messageType?.startsWith('scratchpad.')) {
      console.error('unable to apply message of unknown type', message);
    }
    var reply = {};
    switch (message.messageType.replace('scratchpad.', '')) {
      case 'create':
        reply = getScratchpadCreateResponse();
        setScratchpad(
          new Map(scratchpad).set(
            reply.payload.location,
            message.payload.resource,
          ),
        );
        break;
      case 'update':
        reply = getScratchpadUpdateResponse();
        setScratchpad(
          new Map(scratchpad).set(
            message.payload.location,
            message.payload.resource,
          ),
        );
        break;
      case 'delete':
        reply = getScratchpadDeleteResponse();
        const copy = new Map(scratchpad);
        copy.delete(message.payload.location);
        setScratchpad(copy);
        break;
      default:
        console.error('unknown scratchpad operation', message);
    }
    prepopulate(reply);
  }

  function closeApp() {
    console.log('TODO: closeApp'); // XXX
  }

  function showApp() {
    console.log('TODO: showApp'); // XXX
  }

  function reloadApp() {
    console.log('TODO: reloadApp'); // XXX
  }

  function launchActivity() {
    console.log('TODO: launchActivity'); // XXX
  }

  return (
    <div className="Ehr">
      <header className="Ehr-header">
        <p>
          Mock EHR &nbsp;
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://build.fhir.org/ig/HL7/smart-web-messaging/"
          >
            SMART Web Messaging
          </a>
          &nbsp; Demo App
        </p>
        <button className="config-button" onClick={openConfig}>
          configure
        </button>
      </header>
      <main className="Site-content">
        <dialog className="config-panel" id="config-panel">
          <div className="config-header">
            <div>EHR Settings</div>
            <button className="close-config" onClick={closeConfig}>
              Close
            </button>
          </div>
          <div className="config-settings">
            <div className="config-field">
              <div className="config-label">
                <p>Session Handle</p>
              </div>
              <div className="config-text-value">
                <input
                  type="text"
                  value={sessionHandle}
                  onChange={updateSessionHandle}
                ></input>
              </div>
            </div>
            <div className="config-field">
              <div className="config-label">
                <p>App URL</p>
              </div>
              <div className="config-text-value">
                <input
                  type="text"
                  value={appUrl}
                  onChange={updateAppUrl}
                ></input>
              </div>
            </div>
          </div>
        </dialog>

        <div className="Ehr-buttons">
          <p>Prepopulate response message below for the incoming</p>
          <button onClick={() => prepopulate(getHandshakeResponse())}>
            status.handshake
          </button>
          <button onClick={() => prepopulate(getUiDoneResponse())}>
            ui.done
          </button>
          <button onClick={() => prepopulate(getUiLaunchActivityResponse())}>
            ui.launchActivity
          </button>
          <button onClick={() => prepopulate(getScratchpadCreateResponse())}>
            scratchpad.create
          </button>
          <button onClick={() => prepopulate(getScratchpadUpdateResponse())}>
            scratchpad.update
          </button>
          <button onClick={() => prepopulate(getScratchpadDeleteResponse())}>
            scratchpad.delete
          </button>
        </div>
        <div className="message-panel">
          <div className="from-app">
            <p>
              <b>
                <i>Read-only</i>
              </b>{' '}
              SMART Web Message <i>received</i> from App:
            </p>
            <textarea
              disabled
              className="App-message"
              value={messageFromApp}
              readOnly={true}
            />
            <button className="copy-response" onClick={copyResponseToClipboard}>
              Copy to clipboard
            </button>
          </div>
          <div className="to-send">
            <p>
              <b>
                <i>Editable</i>
              </b>{' '}
              SMART Web Message <i>response</i> to send to App:
            </p>
            <textarea
              id="responseText"
              className="App-message"
              value={response}
              onChange={updateResponse}
            />
            <button
              className="send-button"
              onClick={sendResponse}
              disabled={!isResponseSendable()}
            >
              SEND
            </button>
          </div>
        </div>
        <div className="Ehr-scratchpad">
          <div className="row">
            <p>EHR scratchpad</p>
            <button
              className="apply-message"
              onClick={applyScratchpadMessage}
              disabled={
                !message || !message.messageType?.startsWith('scratchpad')
              }
            >
              Apply Message
            </button>
          </div>
          <div className="row">
            <pre id="scratchpad">
              {JSON.stringify(Object.fromEntries(scratchpad), null, 2)}
            </pre>
          </div>
        </div>
        <div className="Embedded-app">
          <div className="ui-buttons">
            <p>EHR UI Controls</p>
            <button onClick={closeApp}>Close App</button>
            <button onClick={showApp}>Show App</button>
            <button onClick={reloadApp}>Reload App</button>
            <button
              onClick={launchActivity}
              disabled={message?.messageType !== 'ui.launchActivity'}
            >
              Launch Activity
            </button>
          </div>
          <iframe
            id="app-iframe"
            src={appUrl}
            allow="clipboard-write"
            onLoad={() => {
              sessionHandles.set(
                sessionHandle,
                document.getElementById('app-iframe').contentWindow,
              );
            }}
          ></iframe>
        </div>
      </main>
      <footer className="Ehr-footer">
        <p>EHR Footer</p>
      </footer>
    </div>
  );
}

export default Ehr;
