import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import * as swm from './swm'; // XXX: local dev
//import * as swm from 'swm-client-lib';  // npm -i swm-client-lib

//const defaultOrigin = 'https://barabo.github.io';
const defaultOrigin = 'http://localhost:8000';
const defaultHandle = 'RXhhbXBsZSBoYW5kbGUK';

// TODO: set up a launch url and launch as a real app would.
// TODO: move this mock client into the swm lib as an example.
const mockClient = {
  tokenResponse: {
    access_token: 'VGhpcyBpcyBhbiBleGFtcGxlIGFjY2Vzc190b2tlbiEK',
    token_type: 'bearer',
    expires_in: 3600,
    scope: 'patient/Patient.read messaging/ui.launchActivity',
    smart_web_messaging_origin: defaultOrigin,
    smart_web_messaging_handle: defaultHandle,
    state: 'c3RhdGUgZXhhbXBsZSEK',
  },
};

function App() {
  const [message, setMessage] = useState('{}');
  const [response, setResponse] = useState('');
  const [messageHandle, setMessageHandle] = useState(
    mockClient.tokenResponse.smart_web_messaging_handle,
  );
  const [targetOrigin, setTargetOrigin] = useState(
    mockClient.tokenResponse.smart_web_messaging_origin,
  );

  // Enable the postMessage API for EHR responses to the App.
  const init = useCallback(() => {
    swm.enablePostMessage(targetOrigin, (r) => {
      setResponse(JSON.stringify(r, null, 2));
    });
  }, [targetOrigin]);
  useEffect(init, [init]);

  // Auto-send should trigger when the response is updated
  useEffect(() => {
    if (document.getElementById('auto-send').checked) {
      sendMessage();
    }
  }, [message]);

  function openConfig() {
    document.getElementById('config-panel').showModal();
  }

  function updateMessageHandle(e) {
    setMessageHandle(e.target.value);
  }

  function updateTargetOrigin(e) {
    setTargetOrigin(e.target.value);
  }

  function closeConfig() {
    configSave();
    document.getElementById('config-panel').close();
  }

  function configSave() {
    if (targetOrigin !== new URL(targetOrigin).origin) {
      console.error('Invalid origin', targetOrigin);
    }
    mockClient.tokenResponse.smart_web_messaging_handle = messageHandle;
    mockClient.tokenResponse.smart_web_messaging_origin = targetOrigin;
  }

  function updateMessage(e) {
    // TODO: validate the message structure to expose problems with it.
    // TODO: only enable the SEND button when the e.target.value is valid.
    setMessage(e.target.value);
  }

  function stringify(message) {
    setMessage(JSON.stringify(message, null, 2));
  }

  function handshake() {
    stringify(swm.getHandshakeMessage(mockClient));
  }

  function uiDone() {
    stringify(swm.getUiDoneMessage(mockClient));
  }

  function uiLaunchActivity() {
    stringify(
      swm.getUiLaunchActivityMessage(mockClient, 'problem-review', {
        problemLocation: 'Condition/123',
      }),
    );
  }

  function scratchpadCreate() {
    stringify(
      swm.getScratchpadCreateMessage(mockClient, {
        resourceType: 'ServiceRequest',
        status: 'draft',
      }),
    );
  }

  function scratchpadDelete() {
    // TODO: read the contents of the scratchpad to set the location?
    const location = 'MedicationRequest/456';
    stringify(swm.getScratchpadDeleteMessage(mockClient, location));
  }

  function scratchpadUpdate() {
    // TODO: read the contents of the scratchpad to set the resource?
    const resource = {
      resourceType: 'MedicationRequest',
      id: '123',
      status: 'draft',
    };
    const location = `${resource.resourceType}/${resource.id}`;
    stringify(swm.getScratchpadUpdateMessage(mockClient, resource, location));
  }

  function sendMessage() {
    try {
      const m = JSON.parse(message);
      swm.checkMessageType(m);
      setResponse('Failed to send message to EHR!');
      swm.sendMessage(mockClient, m);
      setResponse('Awaiting EHR response...');
    } catch (e) {
      setResponse(e.message);
      console.error('failed to send message', e);
    }
  }

  function copyResponseToClipboard() {
    // This only works in Chrome when the iframe explicitly allows
    // clipboard write access via <iframe allow="clipboard-write" ...
    navigator.clipboard.writeText(response);
  }

  // Display a different title if not embedded or launched.
  var appTitle = 'This demo SMART app is embedded in an EHR.';
  if (window.parent === window.self) {
    appTitle = 'No EHR detected for this demo SMART app; SEND is disabled!';
  }

  // Return the App component.
  return (
    <div className="App">
      <header className="App-header">
        <p>{appTitle}</p>
        <button className="config-button" onClick={openConfig}>
          configure
        </button>
      </header>
      <main className="App-main">
        <dialog className="config-panel" id="config-panel">
          <div className="config-header">
            <div>App Settings</div>
            <button className="close-config" onClick={closeConfig}>
              Close
            </button>
          </div>
          <div className="config-settings">
            <div className="config-field">
              <div className="config-label">
                <p>Messaging Handle</p>
              </div>
              <div className="config-text-value">
                <input
                  type="text"
                  value={messageHandle}
                  onChange={updateMessageHandle}
                ></input>
              </div>
            </div>
            <div className="config-field">
              <div className="config-label">
                <p>EHR Origin</p>
              </div>
              <div className="config-text-value">
                <input
                  type="text"
                  value={targetOrigin}
                  onChange={updateTargetOrigin}
                ></input>
              </div>
            </div>
          </div>
        </dialog>
        <div className="App-buttons">
          <p>Prepopulate message below with a</p>
          <button onClick={handshake}>status.handshake</button>
          <button onClick={uiDone}>ui.done</button>
          <button onClick={uiLaunchActivity}>ui.launchActivity</button>
          <button onClick={scratchpadCreate}>scratchpad.create</button>
          <button onClick={scratchpadUpdate}>scratchpad.update</button>
          <button onClick={scratchpadDelete}>scratchpad.delete</button>
        </div>
        <div className="message-panel">
          <div className="to-send">
            <p>
              <b>
                <i>Editable</i>
              </b>{' '}
              SMART Web Message to send to EHR:
            </p>
            <textarea
              className="App-message"
              value={message}
              onChange={updateMessage}
              spellCheck={false}
            />
            <span className="send-controls">
              <label>
                <input
                  type="checkbox"
                  id="auto-send"
                  disabled={window.parent === window.self}
                />
                Auto-SEND
              </label>
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={window.parent === window.self}
              >
                SEND
              </button>
            </span>
          </div>
          <div className="from-ehr">
            <p>
              <b>
                <i>Read-only</i>
              </b>{' '}
              SMART Web Message EHR response:
            </p>
            <textarea
              disabled={true}
              className="App-message"
              value={response}
              readOnly={true}
              spellCheck={false}
            />
            <button className="copy-response" onClick={copyResponseToClipboard}>
              Copy to clipboard
            </button>
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://tinyurl.com/swm-c10n-code"
        >
          https://tinyurl.com/swm-c10n-code
        </a>
      </footer>
    </div>
  );
}

export default App;
