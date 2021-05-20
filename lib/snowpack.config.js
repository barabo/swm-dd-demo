// Snowpack Configuration File for /lib

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  routes: [
    {"match": "routes", "src": ".*", "dest": "/demo.html"}
  ],
  mount: {
    /* ... */
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};
