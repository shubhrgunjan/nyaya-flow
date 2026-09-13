// Complete Node 18 ECMAScript 2023 Array method & Node 20 util.styleText polyfills for Metro & Jest workers

let util, nodeUtil;
try {
  util = require('util');
  try {
    nodeUtil = require('node:util');
  } catch (e) {
    nodeUtil = util;
  }

  if (util && !util.styleText) {
    util.styleText = function (_format, text) {
      return text;
    };
  }
  if (nodeUtil && !nodeUtil.styleText && util) {
    nodeUtil.styleText = util.styleText;
  }
} catch (e) {
  // Not in Node environment
}

const parseEnvImpl = function (src) {
  const res = {};
  if (typeof src !== 'string' && !(src instanceof Buffer)) return res;
  const lines = src.toString().split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      res[key] = val;
    }
  }
  return res;
};

if (util && !util.parseEnv) {
  util.parseEnv = parseEnvImpl;
}
if (nodeUtil && !nodeUtil.parseEnv) {
  nodeUtil.parseEnv = parseEnvImpl;
}


if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function () {
      return this.slice().reverse();
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.toSpliced) {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value: function (...args) {
      const copy = this.slice();
      copy.splice(...args);
      return copy;
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function (compareFn) {
      return this.slice().sort(compareFn);
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.with) {
  Object.defineProperty(Array.prototype, 'with', {
    value: function (index, value) {
      const copy = this.slice();
      copy[index] = value;
      return copy;
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.findLast) {
  Object.defineProperty(Array.prototype, 'findLast', {
    value: function (predicate, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (predicate.call(thisArg, this[i], i, this)) {
          return this[i];
        }
      }
      return undefined;
    },
    writable: true,
    configurable: true,
  });
}

if (!Array.prototype.findLastIndex) {
  Object.defineProperty(Array.prototype, 'findLastIndex', {
    value: function (predicate, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (predicate.call(thisArg, this[i], i, this)) {
          return i;
        }
      }
      return -1;
    },
    writable: true,
    configurable: true,
  });
}
