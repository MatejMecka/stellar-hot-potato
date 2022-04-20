const {Server} = require("stellar-sdk");
const server = new Server("https://horizon.stellar.org");

async function getOwner(issuer){
    return await server
      .loadAccount(issuer)
      .then(function (resp) {
        // Get data and Base64 decode it
        if(resp.data_attr.currentAccount == undefined) {
            console.log(`An Account hasn't been tagged.`)
            return undefined
        }
        let buff = Buffer.from(resp.data_attr.currentAccount, 'base64');
        let text = buff.toString('ascii');
        
        console.log(`Current account: ${text}`)
        return text

      })
      .catch(function (err) {
        console.error(err);
        throw new Error("Couldn't find owner: " + err)
      });
 }

module.exports.getOwner = getOwner