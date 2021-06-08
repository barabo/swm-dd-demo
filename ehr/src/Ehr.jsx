import React, { useCallback, useEffect, useState } from 'react';
import './Ehr.css';
import * as swm from 'swm-client-lib'; // npm i -s swm-client-lib

const demoHandle = 'RXhhbXBsZSBoYW5kbGUK';
const demoAppUrl = 'https://barabo.github.io/swm-dd-demo/app/';
const defaultAppUrl = localStorage.getItem('ehr/appUrl') || demoAppUrl;
const defaultAppOrigin = new URL(defaultAppUrl).origin;
const defaultSessionHandle =
  localStorage.getItem('ehr/sessionHandle') || demoHandle;
const defaultCountdown = 5;

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
  const [activity, setActivity] = useState({});
  const [countdown, setCountdown] = useState(defaultCountdown);

  const client = new swm.Client(sessionHandle, appOrigin);

  // Enable the client to receive and reply to messages from the embedded app.
  const init = useCallback(() => {
    client.enable({
      receiveMessage: (message) => {
        // Only respond to messages with recognized messaging handles.
        if (sessionHandles.has(message.messagingHandle)) {
          setResponse(
            `Awaiting EHR action in response to the received '${message?.messageType}' message...`,
          );
          setMessage(message);
          setMessageFromApp(JSON.stringify(message, null, 2));
        } else if (message.messagingHandle) {
          console.error(`Unknown messaging handle: ${message.messagingHandle}`);
        }
      },
      receiveError: console.error,
    });
    return client.disable;
  }, [appOrigin, sessionHandle]);
  useEffect(init, [init]);

  // Automatically insert a response template if the received message matches a
  // known messageType.
  useEffect(() => {
    const messageType = message.messageType || '';
    const autoReply = document.getElementById('auto-reply').checked;

    if (messageType === 'ui.done') {
      showCountdown();
    } else if (messageType === 'ui.launchActivity') {
      launchActivity();
    } else if (messageType.startsWith('scratchpad.')) {
      applyScratchpadMessage(autoReply);
    } else if (messageType === 'status.handshake' && autoReply) {
      prepopulate(getHandshakeResponse());
    }
  }, [message]);

  // Auto-send should trigger when the response is updated
  useEffect(() => {
    if (document.getElementById('auto-send').checked && isResponseSendable()) {
      sendResponse();
    }
  }, [response]);

  // Close the app if the 'app-closing' element is visible and the countdown
  // is done.
  useEffect(() => {
    if (countdown <= 0 && document.getElementById('app-closing').open) {
      closeApp();
    }
  }, [countdown]);

  useEffect(() => {
    client.targetOrigin = appOrigin;
  }, [appOrigin]);

  useEffect(() => {
    client.messagingHandle = sessionHandle;
  }, [sessionHandle]);

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
    localStorage.setItem('ehr/appUrl', appUrl);
    localStorage.setItem('ehr/sessionHandle', sessionHandle);
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
    return client.createResponse(message);
  }

  function getUiDoneResponse(success) {
    return client.createResponse(message, {
      status: (success && 'success') || 'failure',
      statusDetail: {
        text: `EHR ${(success && 'hid') || 'did not hide'} the app iframe`,
      },
    });
  }

  function getUiLaunchActivityResponse(success) {
    const activityType = message?.payload?.activityType;
    if (!activityType) {
      console.error('Missing activityType from message', message);
    }
    const status = (success && 'success') || 'failure';
    return client.createResponse(message, {
      status,
      statusDetail: {
        text: `EHR completed activity "${activityType}" with status: ${status}`,
      },
    });
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
    return client.createResponse(message, {
      status: '200 OK',
      location,
      outcome,
    });
  }

  function getScratchpadDeleteResponse() {
    const location = message?.payload?.location ?? 'Encounter/123';
    const status = (scratchpad.has(location) && '200 OK') || '404 NOT FOUND';
    const outcome = undefined; // TODO: add an OperationOutcome
    return client.createResponse(message, { status, outcome });
  }

  function getScratchpadUpdateResponse() {
    const location = message?.payload?.location ?? 'Encounter/123';
    const status = (scratchpad.has(location) && '200 OK') || '404 NOT FOUND';
    const outcome = undefined; // TODO: add an OperationOutcome
    return client.createResponse(message, { status, location, outcome });
  }

  function copyResponseToClipboard() {
    // This only works in Chrome when the iframe explicitly allows
    // clipboard write access via <iframe allow="clipboard-write" ...
    navigator.clipboard.writeText(messageFromApp);
  }

  function isResponseSendable() {
    if (message && response)
      try {
        if (JSON.parse(response).responseToMessageId) {
          return true;
        }
      } catch (error) {}
    return false;
  }

  function sendResponse() {
    try {
      const r = JSON.parse(response);
      swm.checkIsObject(r);
      const window = sessionHandles.get(message.messagingHandle);
      if (!window) {
        console.error('Unknown session handle', sessionHandle);
      }
      client.sendResponse(r, window);
    } catch (e) {
      console.error('failed to send message', e);
    }
  }

  function applyScratchpadMessage(autoReply) {
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
        if (scratchpad.has(message.payload.location)) {
          setScratchpad(
            new Map(scratchpad).set(
              message.payload.location,
              message.payload.resource,
            ),
          );
        }
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
    if (autoReply) {
      prepopulate(reply);
    }
  }

  function closeApp() {
    document.getElementById('app-iframe').src = '';
    document.getElementById('app-closing').close();
    if (document.getElementById('auto-reply').checked) {
      prepopulate(getUiDoneResponse(true));
    }
    document.getElementById('reload-app').style.display = 'block';
  }

  function reloadApp() {
    document.getElementById('app-iframe').src = appUrl;
    document.getElementById('reload-app').style.display = 'none';
  }

  function launchActivity() {
    setActivity(message.payload);
    document.getElementById('activity-panel').showModal();
  }

  function closeActivity() {
    document.getElementById('activity-panel').close();
    if (document.getElementById('auto-reply').checked) {
      prepopulate(getUiLaunchActivityResponse(true));
    }
  }

  function cancelActivity() {
    if (document.getElementById('auto-reply').checked) {
      prepopulate(getUiLaunchActivityResponse(false));
    }
  }

  function saveSessionHandle() {
    // TODO: change this to useState
    sessionHandles.set(
      sessionHandle,
      document.getElementById('app-iframe').contentWindow,
    );
  }

  function showCountdown() {
    document.getElementById('app-closing').showModal();
    setCountdown(defaultCountdown);
    var c = defaultCountdown;
    const i = setInterval(() => {
      setCountdown(--c);
    }, 1000);
    setTimeout(() => {
      clearInterval(i);
    }, defaultCountdown * 1000);
  }

  function cancelClose() {
    document.getElementById('app-closing').close();
    if (document.getElementById('auto-reply').checked) {
      prepopulate(getUiDoneResponse(false));
    }
  }

  function selectedResponse(e) {
    const responseGetters = {
      'status.handshake': getHandshakeResponse,
      'ui.done': getUiDoneResponse,
      'ui.launchActivity': getUiLaunchActivityResponse,
      'scratchpad.create': getScratchpadCreateResponse,
      'scratchpad.update': getScratchpadUpdateResponse,
      'scratchpad.delete': getScratchpadDeleteResponse,
    };
    const selected = e.target.selectedOptions[0].label;
    prepopulate(responseGetters[selected]());
    // Resetting the selected index allows for the same option to
    // be selected repeatedly.
    e.target.selectedIndex = 0;
  }

  return (
    <div className="Ehr">
      <header className="Ehr-header">
        <div className="scratchpad-toggle">
          <button
            id="scratchpad-toggle"
            onClick={() => {
              const contents = document.getElementById('scratchpad');
              const seen = contents.style.display !== 'none';
              contents.style.display = (seen && 'none') || 'block';
            }}
          >
            Scratchpad
          </button>
          <p>{scratchpad.size} Entries</p>
        </div>
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
        <div className="ehr-main">
          <dialog
            className="activity-panel"
            id="activity-panel"
            onCancel={cancelActivity}
          >
            <h1>Activity Launched from App</h1>
            <pre>{JSON.stringify(activity, null, 2)}</pre>
            <button onClick={closeActivity}>Close</button>
          </dialog>
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
              <div className="config-field">
                <div className="config-label">
                  <p>Auto-response</p>
                </div>
                <div className="config-text-value">
                  <input id="auto-reply" type="checkbox" defaultChecked></input>
                </div>
              </div>
            </div>
          </dialog>
          <div className="scratchpad">
            <div className="row">
              <pre id="scratchpad" style={{ display: 'none' }}>
                {JSON.stringify(Object.fromEntries(scratchpad), null, 2)}
              </pre>
            </div>
          </div>
          <div className="message-panel">
            <div className="from-app">
              <p>
                <b>
                  <i>Read-only </i>
                </b>
                message <i>received</i> from App:
              </p>
              <textarea
                disabled
                className="App-message"
                value={messageFromApp}
                readOnly={true}
                spellCheck={false}
              />
              <button
                className="copy-response"
                onClick={copyResponseToClipboard}
              >
                Copy to clipboard
              </button>
            </div>
            <div className="to-send">
              <div className="send-header">
                <p>
                  <b>
                    <i>Editable </i>
                  </b>
                  <i>response</i> to send to App:
                </p>
                <select
                  disabled={!messageFromApp}
                  id="template"
                  onChange={selectedResponse}
                >
                  <option value="">Insert a response...</option>
                  <optgroup label="status">
                    <option value="status.handshake">status.handshake</option>
                  </optgroup>
                  <optgroup label="ui">
                    <option value="ui.done">ui.done</option>
                    <option value="ui.launchActivity">ui.launchActivity</option>
                  </optgroup>
                  <optgroup label="scratchpad">
                    <option value="scratchpad.create">scratchpad.create</option>
                    <option value="scratchpad.update">scratchpad.update</option>
                    <option value="scratchpad.delete">scratchpad.delete</option>
                  </optgroup>
                </select>
              </div>
              <textarea
                id="responseText"
                className="App-message"
                value={response}
                onChange={updateResponse}
                spellCheck={false}
              />
              <span className="send-controls">
                <label title="Automatically SEND the response above when updated.">
                  <input type="checkbox" id="auto-send" />
                  Auto-SEND
                </label>
                <button
                  className="send-button"
                  onClick={sendResponse}
                  disabled={!isResponseSendable()}
                >
                  SEND
                </button>
              </span>
            </div>
          </div>
        </div>
        <div className="Embedded-app">
          <dialog
            onCancel={cancelClose}
            className="app-closing"
            id="app-closing"
          >
            <div className="closing-controls">
              <div className="closing-timer">
                <button onClick={cancelClose}>Cancel</button>
                <h1>Closing App in {countdown} seconds...</h1>
              </div>
              <button onClick={closeApp}>Close Now</button>
            </div>
          </dialog>
          <iframe
            id="app-iframe"
            src={appUrl}
            allow="clipboard-write"
            onLoad={saveSessionHandle}
          ></iframe>
          <button id="reload-app" className="reload-app" onClick={reloadApp}>
            Reload
          </button>
        </div>
      </main>
      <footer className="Ehr-footer">
        <p>EHR Footer</p>
      </footer>
    </div>
  );
}

export default Ehr;
