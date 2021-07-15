import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import * as swm from 'swm-client-lib'; // npm -i swm-client-lib

const demoHandle = 'RXhhbXBsZSBoYW5kbGUK';
const demoEhrOrigin = 'https://barabo.github.io';
const defaultOrigin = localStorage.getItem('app/ehrOrigin') || demoEhrOrigin;
const defaultHandle = localStorage.getItem('app/messageHandle') || demoHandle;

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

  const clientHolder = useRef(null);

  useEffect(() => {
    console.debug('creating a new swm client in the app');
    const newClient = new swm.Client(messageHandle, targetOrigin);
    newClient.enable({
      receiveResponse: (r) => {
        setResponse(JSON.stringify(r, null, 2));
      },
      receiveError: console.error,
    });
    clientHolder.current = newClient;
    return () => {
      console.log('disabling an expired swm client in the app');
      newClient.disable();
    }
  }, [targetOrigin, messageHandle]);

  // Auto-send should trigger when the response is updated
  useEffect(() => {
    if (document.getElementById('auto-send').checked) {
      sendMessage();
    }
  }, [message]);

  // Update the response panel with a hint when the message changes.
  useEffect(() => {
    if (message !== '{}' && !document.getElementById('auto-send').checked) {
      setResponse('Click SEND to send message to EHR...');
    }
  }, [message]);

  useEffect(() => {
    try {
      new URL(targetOrigin);
      clientHolder.current.targetOrigin = targetOrigin;
    } catch (e) {
      console.warn('not changing client origin:', e);
    }
  }, [targetOrigin]);

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
    try {
      const url = new URL(targetOrigin);
      if (url.origin !== targetOrigin) {
        console.warn(
          `EHR origin is not normalized - saving as '${url.origin}'`,
        );
      }
      mockClient.tokenResponse.smart_web_messaging_origin = url.origin;
      localStorage.setItem('app/ehrOrigin', url.origin);
    } catch (e) {
      console.log('not saving changes to EHR origin!');
      console.error(e);
    }
    mockClient.tokenResponse.smart_web_messaging_handle = messageHandle;
    localStorage.setItem('app/messageHandle', messageHandle);
  }

  function updateMessage(e) {
    // TODO: validate the message structure to expose problems with it.
    // TODO: only enable the SEND button when the e.target.value is valid.
    setMessage(e.target.value);
  }

  function prepopulate(message) {
    setMessage(JSON.stringify(message, null, 2));
  }

  function getHandshakeMessage() {
    return clientHolder.current.createMessage('status.handshake');
  }

  function getUiDoneMessage() {
    return clientHolder.current.createMessage('ui.done');
  }

  function getUiLaunchActivityMessage() {
    return clientHolder.current.createMessage('ui.launchActivity', {
      activityType: 'problem-review',
      activityParameters: {
        problemLocation: 'Condition/123',
      },
    });
  }

  function getScratchpadCreateMessage() {
    return clientHolder.current.createMessage('scratchpad.create', {
      resource: {
        resourceType: 'ServiceRequest',
        status: 'draft',
      },
    });
  }

  function getScratchpadReadMessage() {
    return clientHolder.current.createMessage('scratchpad.read');
  }

  function getScratchpadDeleteMessage() {
    // TODO: read the contents of the scratchpad to set the location?
    const location = 'MedicationRequest/456';
    return clientHolder.current.createMessage('scratchpad.delete', {
      location,
    });
  }

  function getScratchpadUpdateMessage() {
    // TODO: read the contents of the scratchpad to set the resource?
    const resource = {
      resourceType: 'MedicationRequest',
      id: '123',
      status: 'draft',
    };
    const location = `${resource.resourceType}/${resource.id}`;
    return clientHolder.current.createMessage('scratchpad.update', {
      location,
      resource,
    });
  }

  function sendMessage() {
    try {
      const m = JSON.parse(message);
      swm.checkIsObject(m);
      setResponse('Failed to send message to EHR!');
      clientHolder.current.sendMessage(m);
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
  var appTitle = 'EMBEDDED APP';
  if (window.parent === window.self) {
    appTitle = 'No EHR detected for this demo SMART app; SEND is disabled!';
  }

  const messageGetters = {
    'status.handshake': getHandshakeMessage,
    'ui.done': getUiDoneMessage,
    'ui.launchActivity': getUiLaunchActivityMessage,
    'scratchpad.create': getScratchpadCreateMessage,
    'scratchpad.read': getScratchpadReadMessage,
    'scratchpad.update': getScratchpadUpdateMessage,
    'scratchpad.delete': getScratchpadDeleteMessage,
  };

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
        <div className="message-panel">
          <div className="to-send">
            <div className="send-header">
              <p>
                <b>
                  <i>Editable </i>
                </b>
                Message to send to EHR:
              </p>
              <select
                id="template"
                onChange={(e) => {
                  const selected = e.target.selectedOptions[0].label;
                  prepopulate(messageGetters[selected]());
                  // Resetting the selected index allows for the same option to
                  // be selected repeatedly.
                  e.target.selectedIndex = 0;
                }}
              >
                <option value="">Insert a message...</option>
                <optgroup label="status">
                  <option value="status.handshake">status.handshake</option>
                </optgroup>
                <optgroup label="ui">
                  <option value="ui.done">ui.done</option>
                  <option value="ui.launchActivity">ui.launchActivity</option>
                </optgroup>
                <optgroup label="scratchpad">
                  <option value="scratchpad.create">scratchpad.create</option>
                  <option value="scratchpad.read">scratchpad.read</option>
                  <option value="scratchpad.update">scratchpad.update</option>
                  <option value="scratchpad.delete">scratchpad.delete</option>
                </optgroup>
              </select>
            </div>
            <textarea
              className="App-message"
              value={message}
              onChange={updateMessage}
              spellCheck={false}
            />
            <span className="send-controls">
              <label disabled={window.parent === window.self}>
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
                <i>Read-only </i>
              </b>
              EHR response:
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
          href="https://tinyurl.com/swm-dd-code"
        >
          https://tinyurl.com/swm-dd-code
        </a>
      </footer>
    </div>
  );
}

export default App;
