'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const magicCliUtils = require('magic-cli-utils');

const getInheritParams = () => {
  const args = JSON.parse(process.argv.slice(2)[0]);
  const inheritArgs = /* @__PURE__ */ Object.create(null);
  inheritArgs.projectName = args[0];
  inheritArgs.force = args[1];
  inheritArgs.cmd = args[2];
  return inheritArgs;
};

const { error, echo } = magicCliUtils.useLogger();
const init = async () => {
  try {
    const args = getInheritParams();
    echo(` init args `, args);
  } catch (e) {
    throw new Error(error(e.message, { needConsole: false }));
  }
};
init();

exports.init = init;
