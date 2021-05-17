import React, { useState } from 'react';
import './App.css';
import * as swm from './swm';  // XXX: local dev
//import * as swm from 'swm-client-lib';  // npm -i swm-client-lib

// TODO: detect the presence of a SMART client and use that instead
// TODO: move this mock client into the swm lib as an example.
const mockClient = {
  tokenResponse: {
    "access_token": "VGhpcyBpcyBhbiBleGFtcGxlIGFjY2Vzc190b2tlbiEK",
    "token_type": "bearer",
    "expires_in": 3600,
    "scope": "patient/Patient.read messaging/ui.launchActivity",
    "smart_web_messaging_origin": 'http://localhost:8000',
    "smart_web_messaging_handle": "RXhhbXBsZSBoYW5kbGUK",
    "state": "c3RhdGUgZXhhbXBsZSEK",
  }
}

function App() {
  const [message, setMessage] = useState("{}");
  const [response, setResponse] = useState("");
  // TODO: allow the UI to modify these values from the SMART launch client
  const [messageHandle, setMessageHandle] = useState(
    mockClient.tokenResponse.smart_web_messaging_handle
  );
  const [targetOrigin, setTargetOrigin] = useState(
    mockClient.tokenResponse.smart_web_messaging_origin
  );

  // Enable the postMessage API for EHR responses to the App.
  swm.enablePostMessage(targetOrigin, (response) => {
    setResponse(JSON.stringify(response, null, 2));
  });
  
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
      swm.getUiLaunchActivityMessage(
        mockClient, 'problem-review', {
          'problemLocation': 'Condition/123',
        }
      )
    );
  }

  function scratchpadCreate() {
    stringify(
      swm.getScratchpadCreateMessage(
        mockClient, {
          'resourceType': 'ServiceRequest',
          'status': 'draft',
        }
      )
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
      'resourceType': 'MedicationRequest',
      'id': '123',
      'status': 'draft',
    };
    const location = `${resource.resourceType}/${resource.id}`;
    stringify(
      swm.getScratchpadUpdateMessage(mockClient, resource, location)
    );
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
      </header>
      <main className="App-main">
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
            <p><b><i>Editable</i></b> SMART Web Message to send to EHR:</p>
            <textarea
              className="App-message"
              value={message}
              onChange={updateMessage}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={window.parent === window.self}
            >SEND</button>
          </div>
          <div className="from-ehr">
            <p><b><i>Read-only</i></b> SMART Web Message EHR response:</p>
            <textarea
              disabled={true}
              className="App-message"
              value={response}
              readOnly={true}
            />
            <button
              className="copy-response"
              onClick={copyResponseToClipboard}
            >Copy to clipboard</button>
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <a 
          target="_blank"
          rel="noreferrer noopener"      
          href='https://tinyurl.com/swm-c10n-code'
        >https://tinyurl.com/swm-c10n-code</a>
      </footer>
    </div>
  );
}

export default App;
