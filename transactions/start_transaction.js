const {
    Server,
    Networks,
    TransactionBuilder,
    Operation,
    Asset,
    Keypair,
  } = require("stellar-sdk");


const startTransaction = function (transaction, NFT_ASSET, person_who_holds_the_potato) {
  // 1. Mint the Asset
  transaction.addOperation(
    Operation.setOptions({
      setFlags: 15,
      homeDomain: process.env.HOME_DOMAIN, // This is where we configure the NFT we're about the issue as an auth required asset
      source: NFT_ASSET.issuer,
    })
  );

  // 2. Finally the other person can accept it.
  transaction.addOperation(
    Operation.changeTrust({
      asset: NFT_ASSET,
      limit: "1",
    })
  );

  const WINNER_NFT_ASSET = new Asset(
    `Potato${person_who_holds_the_potato.substring(14, 19)}`,
    process.env.PUBLIC_KEY
  );

  transaction.addOperation(
    Operation.changeTrust({
      asset: WINNER_NFT_ASSET,
      limit: "1",
    })
  );

  transaction.addOperation(
    Operation.setTrustLineFlags({
      // This is the first authorization open operation for the new NFT allowing it to be minted from the issuing account to the mint/royalty user account
      trustor: person_who_holds_the_potato,
      asset: NFT_ASSET,
      flags: {
        authorized: true,
      },
      source: NFT_ASSET.issuer,
    })
  );

  transaction.addOperation(
    Operation.manageSellOffer({
      selling: NFT_ASSET,
      buying: Asset.native(),
      amount: "0.0000001",
      price: "1",
      offerId: "0",
      //source: process.env.TEMP_DISTRIBUTOR_PUBLIC_KEY
      source: NFT_ASSET.issuer,
    })
  );

  transaction.addOperation(
    Operation.manageBuyOffer({
      buying: NFT_ASSET,
      selling: Asset.native(),
      buyAmount: "0.0000001",
      price: "3",
      offerId: "0",
    })
  );

  transaction.addOperation(
    Operation.setTrustLineFlags({
      // Now that the payment for the NFT has been made we close the authorization effectively locking down the NFT into the user account where they may now hold the NFT but not sell it unless they do so through the authorized/official `offer.js` contract
      trustor: person_who_holds_the_potato,
      asset: NFT_ASSET,
      flags: {
        authorized: false,
      },
      source: NFT_ASSET.issuer,
    })
  );

  transaction.addOperation(
    Operation.manageData({
      name: "currentAccount",
      value: person_who_holds_the_potato,
      source: NFT_ASSET.issuer,
    })
  );

  transaction.setTimeout(0);
  transaction = transaction.build();
  transaction.sign(Keypair.fromSecret(process.env.PRIV_KEY));
  return transaction
};

module.exports.startTransaction = startTransaction;
