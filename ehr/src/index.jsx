import React from 'react';
import ReactDOM from 'react-dom';
import Ehr from './Ehr.jsx';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Ehr />
  </React.StrictMode>,
  document.getElementById('root'),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
