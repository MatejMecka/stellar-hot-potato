const { Transaction, Keypair } = require("stellar-sdk");

function checkSignatures(xdr, network, owner){
    // Get the XDR & Account's Public Key as a Keypair
    let transac = undefined
    try {
       transac = new Transaction(xdr, network)
    } catch(err) {
      throw new Error("Invalid transaction")
    }
    const hashedSignatureBase = transac.hash();
    const lookup_key = Keypair.fromPublicKey(owner);
    
    // Check Each signature if it contains
    transac.signatures.forEach(elem => {
        if(lookup_key.verify(hashedSignatureBase, elem._attributes.signature)){
            return true
        }
    })
    return false;
}

module.exports.checkSignatures = checkSignatures