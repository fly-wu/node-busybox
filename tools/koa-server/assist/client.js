const axios = require('axios');
const utils = require('../../../utils');

class Client {
  constructor(origin) {
    this.net = new axios.Helper({
      headers: {
        common: {
          token: 'fdaf'
        }
      }
    });
    this.URL_LIST = {
      get_common: {
        path: '/api/test/get/common',
        method: 'get',
      },
      echo: {
        path: '/api/test/echo',
      }
    };
    Object.keys(this.URL_LIST).forEach(key => {
      this.URL_LIST[key]['url'] = origin + this.URL_LIST[key]['path'];
    })
  }

  async getCommon() {
    const data = await utils.node.showRequestProcess(Object.assign({
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }, this.URL_LIST['get_common']));
    console.log(data);
  }

  async cookie() {
    const axiosResponse = await utils.node.showRequestProcess(Object.assign({
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      },
      query: {
        cookie: true
      }
    }, this.URL_LIST['echo']));
    console.log(axiosResponse.data);
  }

  test() {
    // this.getCommon();
    this.cookie();
  }
}

const origin = 'http://127.0.0.1:3000'
new Client(origin).test();