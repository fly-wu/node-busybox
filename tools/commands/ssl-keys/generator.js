const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const pki = forge.pki;

/**
 * 根据所给域名生成对应证书
 * @param  {[type]} caKey  [description]
 * @param  {[type]} caCert [description]
 * @param  {[type]} domain [description]
 * @return {[type]}        [description]
 */
function createFakeCertificateByDomain(caKey, caCert, domain) {
  var keys = pki.rsa.generateKeyPair(2046);
  var cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;

  cert.serialNumber = (new Date()).getTime()+'';
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
  var attrs = [
    {
      name: 'commonName',
      value: domain
    }, {
      name: 'countryName',
      value: 'CN'
    }, {
      shortName: 'ST',
      value: 'BeiJing'
    }, {
      name: 'localityName',
      value: 'BeiJing'
    }, {
      name: 'organizationName',
      value: 'xifei.wu'
    }, {
      shortName: 'OU',
      value: 'xifei.wu'
    }];

    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);

    cert.setExtensions([{
      name: 'basicConstraints',
      critical: true,
      cA: false
    },
    {
      name: 'keyUsage',
      critical: true,
      digitalSignature: true,
      contentCommitment: true,
      keyEncipherment: true,
      dataEncipherment: true,
      keyAgreement: true,
      keyCertSign: true,
      cRLSign: true,
      encipherOnly: true,
      decipherOnly: true
    },
    {
      name: 'subjectAltName',
      altNames: [{
        type: 2,
        value: domain
      }]
    },
    {
      name: 'subjectKeyIdentifier'
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name:'authorityKeyIdentifier'
    }
  ]);
  cert.sign(caKey, forge.md.sha256.create());

  return {
    key: pki.privateKeyToPem(keys.privateKey),
    cert: pki.certificateToPem(cert)
  };
}

// console.log(process.argv);

module.exports = function generator(domain) {
  const caCertPem = fs.readFileSync(path.join(__dirname, 'rootCA.crt'));
  const caKeyPem = fs.readFileSync(path.join(__dirname, 'rootCA.key.pem'));
  const caCert = forge.pki.certificateFromPem(caCertPem);
  const caKey = forge.pki.privateKeyFromPem(caKeyPem);
  const results = createFakeCertificateByDomain(caKey, caCert, domain);
  const CUR_DIR = process.cwd();
  fs.writeFileSync(path.join(CUR_DIR, `${domain}.crt`), results.cert);
  fs.writeFileSync(path.join(CUR_DIR, `${domain}.key.pem`), results.key);
}

