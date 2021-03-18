// This code for implementing an ESM wrapper is copied from this article:
// https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1
import cjsModule from '../index.js';
export const foo = cjsModule.foo;
