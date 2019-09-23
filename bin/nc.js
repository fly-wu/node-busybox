#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const childProcess = require('child_process');
const commander = require('commander');
const NodeUtils = require('../utils/node');
const nodeUtils = new NodeUtils();

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

commander.command('lines-count <dir>')
  .description('show lines count of all files under a directory')
  .action(async dir => {
    require('../tools/commands/lines-count.js')(dir);
  });

commander.command('find <key>')
  .description('find file by key ')
  .option('-d, --dir <directory>', 'data to post', '.')
  .action(async (key, command) => {
    var {dir} = command;
    dir = path.resolve(dir);
    console.log(`searching dir: ${dir}`);
    console.log('');
    const readDirRecursive = require('fs-readdir-recursive/with-dir');
    const fileList = readDirRecursive(dir);
    const reg = new RegExp(key);
    const result = fileList.filter(it => {
      return reg.test(it);
    });
    if (result.length === 0) {
      console.log('not found');
    } else {
      console.log(`${result.length} files found:`);
      result.forEach(it => console.log(it));
    }
  });


commander.command('rm <key>')
  .description('find file by key ')
  .option('-d, --dir <directory>', 'data to post', '.')
  .action(async (key, command) => {
    var {dir} = command;
    dir = path.resolve(dir);
    console.log(`target dir: ${dir}`);
    console.log('');
    const readDirRecursive = require('fs-readdir-recursive');
    if (!fs.statSync(dir).isDirectory()) {
      console.log(`Error: ${dir} is not directory!`);
      return;
    }
    const reg = new RegExp(key);
    const fileList = fs.readdirSync(dir).filter(it => reg.test(it));
    if (fileList.length === 0) {
      console.log('not file found');
      return;
    }
    console.log('files to delete:');
    fileList.forEach(it => console.log(it));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    answer = await new Promise((resolve, reject) => {
      rl.question('你确定要删除这些文件？(yes/y)', (answer) => {
        resolve(answer);
        rl.close();
      });
    });
    if (['yes', 'y'].includes(answer)) {
      fileList.forEach(it => {
        nodeUtils.deleteFile(path.resolve(dir, it));
      });
      console.log(`deleted: ${fileList.length}`);
    } else {
      console.log('取消删除');
    }
  });

commander.command('ssl-keys <domain>').action(async domain => {
  require('../tools/commands/ssl-keys/generator.js')(domain);
});

commander.command('post <url>')
  .option('-d, --data <data>', 'data to post', '{}')
  .option('-t, --content-type <contentType>', 'data to post', 'json')
  .action(async (url, command) => {
    var {data, contentType} = command;
    const contentTypeMap = {
      json: 'application/json',
      urlencoded: 'application/x-www-form-urlencoded',
      form:'multipart/form-data'
    };
    if (contentTypeMap.hasOwnProperty(contentType)) {
      contentType = contentTypeMap[contentType];
    } else {
      contentType = contentTypeMap['json'];
    }
    // console.log(url, data, contentType);
    nodeUtils.showRequestProcess({
      method: 'post',
      url,
      data,
      headers: {
        'content-type': contentType
      }
    })
  });

commander.command('get <url>')
  .option('-h, --headers <headers>', 'headers for get, json string or file path', '{}')
  // .option('-d, --data <data>', 'data to post', '{}')
  // .option('-t, --content-type <contentType>', 'data to post', 'json')
  .action(async (url, command) => {
    var {headers} = command;
    if (fs.existsSync(path.resolve(headers))) {
      headers = await nodeUtils.getStreamData(fs.createReadStream(path.resolve(headers)));
      headers = headers.toString();
    }
    try {
      // may be in form of json string
      headers = JSON.parse(headers);
    } catch (err) {
      // may be string translated from stream
      const isOK = headers.split('\n').filter(it => it).every(it => it.indexOf(':') > -1);
      if (!isOK) {
        console.log('bad format: headers');
        return;
      }
      const results = {};
      headers.split('\n').filter(it => it).forEach(it => {
        const loc = it.indexOf(':');
        const key = it.slice(0, loc).trim();
        const value = it.slice(loc + 1).trim();
        results[key] = value;
      });
      headers = results;
    }
    nodeUtils.showRequestProcess({
      method: 'get',
      url,
      headers
    })
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