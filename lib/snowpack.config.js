// Snowpack Configuration File for /lib

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  exclude: [
    '**/node_modules/**/*',
    '**/prepublish.sh',
    '**/snowpack.config.js',
  ],
  routes: [
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
    sourcemap: true,
    metaUrlPath: "meta",
  },
};
