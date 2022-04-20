/*
Und wenn du lange in einen Abgrund blickst, blickt der Abgrund auch in dich hinein
- Friedrich Nietzche
*/
const network = StellarSdk.Networks.PUBLIC;

const shortenUrl = async function (long_url) {
  return fetch(`https://api.shrtco.de/v2/shorten?url=${long_url}`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data["result"]["full_short_link"];
    })
    .catch((err) => {
      console.error("URL Shortening failed... Defaulting to long url");
      console.error(err);
      return long_url;
    });
};

const checkValidSignature = function (xdr, issuer) {
  let transac = undefined;
  try {
    transac = new StellarSdk.Transaction(xdr, network);
  } catch (err) {
    return undefined;
  }
  const hashedSignatureBase = transac.hash();
  const lookup_key = StellarSdk.Keypair.fromPublicKey(issuer);

  // Check Each signature if it contains
  transac.signatures.forEach((elem) => {
    if (lookup_key.verify(hashedSignatureBase, elem._attributes.signature)) {
      return true;
    }
  });
  return false;
};

const checkLobstr = function(){
  return
}

const rejectedAction = function(){
  
}