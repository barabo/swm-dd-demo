import React, { useState, useEffect } from 'react';
import './Ehr.css';
import * as swm from './swm';

/**
 * Maps scratchpad 'locations' to objects.
 * TODO: does an update to this trigger a refresh?
 */
const scratchpad = new Map();

/**
 * @returns The contents of the EHR scratchpad.
 */
function getScratchpad() {
  return [...scratchpad.values()];
}

function Ehr() {
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
        <p>TODO: display buttons to control messaging and stats table.</p>
      </main>
      <div className="Ehr-scratchpad">
        <p>EHR scratchpad</p>
        <pre id="scratchpad">{
          JSON.stringify(getScratchpad(), null, 2)
        }</pre>
      </div>
      <div className="Embedded-app">
        <iframe src="http://localhost:8001" allow="clipboard-write"></iframe>
      </div>
      <footer className="Ehr-footer">
        <p>
          This is the Mock EHR footer area.
        </p>
      </footer>
    </div>
  );
}

export default Ehr;
