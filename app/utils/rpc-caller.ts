const https = require("https");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const balance = "https://67.207.68.241/chains/main/blocks/head/context/contracts/tz1Kz6VSEPNnKPiNvhyio6E1otbSdDhVD9qB/balance"
//const bakingRights = "https://67.207.68.241:443/chains/main/blocks/head/helpers/baking_rights\?delegate=tz1Kz6VSEPNnKPiNvhyio6E1otbSdDhVD9qB\&max_priority=10"

const req = () => new Promise((resolve, reject) => {
  https.get(balance, (res:any) => {
    const { statusCode, headers } = res;
    let body = "";

    res.setEncoding('utf8');
    res.on('data', (data:any) => {
      body += data;
    });
    
    res.on('end', () => resolve({ body: JSON.parse(body), statusCode, headers }));

  }).on('error', (e:any) => {
    console.error(e);
    reject();
  });
});

export default req;