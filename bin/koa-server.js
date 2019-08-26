#!/usr/bin/env node
'use strict'
const path = require('path');
const commander = require('commander');
const KoaServer = require('../tools/koa-server');


const program = new commander.Command();

program
  .option('-s, --static <path>', 'set base dir for static server', process.cwd())
  .option('-a, --assets [boolean]', 'as assets server', false)
  .option('--assist [boolean]', 'as a server for test', false);

program.parse(process.argv);

new KoaServer({
  staticDir: program.static.startsWith('/') ? program.static : path.resolve(process.cwd(), program.static),
  uploadDir: process.cwd()
}, {
  static: program.static,
  assets: program.assets,
  assist: program.assist,
}).start();


