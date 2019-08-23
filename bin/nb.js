#!/usr/bin/env node

const childProcess = require('child_process');
const crypto = require('crypto');
const busybox = require('../');
const commander = busybox.commander;
const nodeUtils = busybox.utils.node;

commander.command('ps').action(() => {
  const cmdPS = nodeUtils.spawnCmdPS();
  cmdPS.stdout.pipe(process.stdout);
  cmdPS.stderr.pipe(process.stderr);
});

commander.command('kill <pid>').action(async (pid) => {
  try {
    // process.kill(pid, 'SIGTERM');
    // console.log(pid);
    const pidKilled = await nodeUtils.killByPid(pid);
    console.log(`killed: ${pidKilled}`);
  } catch (err) {
    console.log(err);
  }
  // const cmdPS = nodeUtils.spawnCmdPS();
  // cmdPS.stdout.pipe(process.stdout);
  // cmdPS.stderr.pipe(process.stderr);
});

commander.command('md5 <content>').action(async (content) => {
  console.log(crypto.createHash('md5').update(content).digest('hex'))
});

// commander
//   .command('setup [env]')
//   .description('run setup commands for all envs')
//   .option("-s, --setup_mode [mode]", "Which setup mode to use")
//   .action(function(env, options){
//     var mode = options.setup_mode || "normal";
//     env = env || 'all';
//     console.log('setup for %s env(s) with %s mode', env, mode);
//   });


commander.parse(process.argv);