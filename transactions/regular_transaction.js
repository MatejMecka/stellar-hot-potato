const {
  Server,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
} = require("stellar-sdk");

const regularTransaction = function (
  transaction,
  NFT_ASSET,
  person_who_holds_the_potato,
  person_who_gets_the_potato
) {
  // Transfer the potato
  // 1. Approve of transfer
  // 2. Establiish trustline

  transaction.addOperation(
    Operation.changeTrust({
      asset: NFT_ASSET,
      limit: "1",
      source: person_who_gets_the_potato,
    })
  );

  transaction.addOperation(
    Operation.setTrustLineFlags({
      trustor: person_who_holds_the_potato,
      asset: NFT_ASSET,
      flags: {
        authorized: true,
      },
      source: NFT_ASSET.issuer,
    })
  );

  transaction.addOperation(
    Operation.setTrustLineFlags({
      trustor: person_who_gets_the_potato,
      asset: NFT_ASSET,
      flags: {
        authorized: true,
      },
      source: NFT_ASSET.issuer,
    })
  );

  // 3. Transfer the Asset
  transaction.addOperation(
    Operation.manageSellOffer({
      selling: NFT_ASSET,
      buying: Asset.native(),
      amount: "0.0000001",
      price: "1",
      offerId: "0",
      source: person_who_holds_the_potato,
    })
  );

  transaction.addOperation(
    Operation.manageBuyOffer({
      buying: NFT_ASSET,
      selling: Asset.native(),
      buyAmount: "0.0000001",
      price: "3",
      offerId: "0",
      source: person_who_gets_the_potato,
    })
  );

  // 4. Lock the NFT to the user again
  transaction.addOperation(
    Operation.setTrustLineFlags({
      // Now that the payment for the NFT has been made we close the authorization effectively locking down the NFT into the user account where they may now hold the NFT but not sell it unless they do so through the authorized/official `offer.js` contract
      trustor: person_who_gets_the_potato,
      asset: NFT_ASSET,
      flags: {
        authorized: false,
      },
      source: NFT_ASSET.issuer,
    })
  );

  // 5. Update the Account

  transaction.addOperation(
    Operation.manageData({
      name: "currentAccount",
      value: person_who_gets_the_potato,
      source: NFT_ASSET.issuer,
    })
  );
  const WINNER_NFT_ASSET = new Asset(
    `Potato${person_who_holds_the_potato.substring(14, 19)}`,
    process.env.PUBLIC_KEY
  );

  // 6. Send Winner NFT
  transaction.addOperation(
    Operation.changeTrust({
      asset: WINNER_NFT_ASSET,
      limit: "1",
      source: person_who_holds_the_potato,
    })
  );

  transaction.addOperation(
    Operation.setTrustLineFlags({
      // This is the first authorization open operation for the new NFT allowing it to be minted from the issuing account to the mint/royalty user account
      trustor: person_who_holds_the_potato,
      asset: WINNER_NFT_ASSET,
      flags: {
        authorized: true,
      },
      source: WINNER_NFT_ASSET.issuer,
    })
  );

  transaction.addOperation(
    Operation.payment({
      asset: WINNER_NFT_ASSET,
      amount: "0.0000001",
      destination: person_who_holds_the_potato,
      source: NFT_ASSET.issuer,
    })
  );

  transaction.setTimeout(0);
  transaction = transaction.build();
  transaction.sign(Keypair.fromSecret(process.env.PRIV_KEY));
  return transaction;
};

module.exports.regularTransaction = regularTransaction;
