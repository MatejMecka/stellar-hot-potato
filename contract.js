const {
    Server,
    Networks,
    TransactionBuilder,
    Asset,
    Keypair,
  } = require("stellar-sdk");

require("dotenv").config();

const server = new Server(process.env.HORIZON_URL);
const { startTransaction } = require('./transactions/start_transaction.js')
const { regularTransaction } = require('./transactions/regular_transaction.js')
const network = 1

  const NFT_ASSET = new Asset(process.env.ASSET_CODE, process.env.PUBLIC_KEY);
  const TIMEBOUNDS = 2;
  
  function queryTrades(person, search_time_bounds = false) {
    let cursor = "";
    // Todo: Figure out how to use next recursively to download all trades
    // This is just a POC
    return new Promise(function (resolve, reject) {
      server
        .trades()
        .forAccount(person)
        .cursor(cursor)
        .limit(200)
        .order("desc")
        .call()
        .then(function (trades) {
          trades = trades["records"];
          if (!search_time_bounds) {
            for (let trade = 0; trade < trades.length; trade++) {
              if (
                trades[trade]["counter_asset_code"] == NFT_ASSET.code &&
                trades[trade]["counter_asset_issuer"] == NFT_ASSET.issuer
              ) {
                console.log("ASSET FOUND IN RECIEVER!");
                reject(Error("Already owned"));
              }
            }
          } else {
            for (let trade = 0; trade < trades.length; trade++) {
              if (
                (trades[trade]["counter_asset_code"] == NFT_ASSET.code ||
                  trades[trade]["base_asset_type"] == NFT_ASSET.code) &&
                (trades[trade]["counter_asset_issuer"] == NFT_ASSET.issuer ||
                  trades[trade]["base_asset_issuer"] == NFT_ASSET.issuer)
              ) {
                const trade_date = new Date(trades[trade]["ledger_close_time"]);
                const date_diff = new Date() - trade_date;
                const diffDays = Math.ceil(date_diff / (1000 * 60 * 60 * 24));
                console.log(diffDays < TIMEBOUNDS);
  
                if (diffDays > TIMEBOUNDS) {
                  reject(Error("Expired"));
                } else {
                  console.log("Asset hasn't expired");
                  resolve(true);
                  return true;
                }
              }
            }
          }
          resolve(true);
        })
        .catch((err) => {
          reject(Error("Network Request Failed"));
          return;
        });
    });
  }
  
  module.exports.getXDR = async (body) => {
    return new Promise(async function (resolve, reject) {
      const {
        source: person_who_holds_the_potato,
        destination: person_who_gets_the_potato,
      } = body;
  
      console.log(person_who_holds_the_potato);
      console.log(person_who_gets_the_potato);
      
      // We need to transfer the potato from the source to the destination
      if (!person_who_holds_the_potato || !person_who_gets_the_potato) {
        reject(Error("Missing source or destination"));
        return;
      }
  
      // No passing to the same account
      if (person_who_holds_the_potato === person_who_gets_the_potato) {
        reject(Error("Source and destination cannot be the same"));
        return;
      }
  
      try {
        Keypair.fromPublicKey(person_who_holds_the_potato);
      } catch (err) {
        reject(Error("Invalid Public Key for Source"));
        return;
      }
  
      try {
        Keypair.fromPublicKey(person_who_gets_the_potato);
      } catch (err) {
        reject(Error("Invalid Public Key for Destination"));
        return;
      }
  
      const account = await server.loadAccount(person_who_holds_the_potato);
      const fee = await server.fetchBaseFee()*10000;
      //const fee = 1
      let transaction = new TransactionBuilder(account, {
        fee,
        //networkPassphrase: Networks.TESTNET,
        networkPassphrase: Networks.PUBLIC,
      });
  
      // Check if the Asset is issued
      server
        .assets()
        .forCode(NFT_ASSET.code)
        .forIssuer(NFT_ASSET.issuer)
        .call()
        .then(async function (asset) {
          if (asset["records"].length === 0) {
            console.log("Asset not issued yet");
            // Not issued
            transaction = startTransaction(transaction, NFT_ASSET, person_who_holds_the_potato)
            
            console.log(transaction.toXDR());
            resolve(transaction.toXDR());
            return transaction.toXDR();
          } else {
            // Asset is issued
            // Check if owned already
  
            console.log("ASSET IS ISSUED!");
  
            console.log("SEARCHING FOR OWNERSHIP OF ASSET");
            await queryTrades(person_who_gets_the_potato, false).catch((err) => {
              console.log(err);
              reject(err);
            });
  
            // Check if timebounds are valid
            queryTrades(person_who_holds_the_potato, true)
              .then((data) => {
                transaction = regularTransaction(transaction, NFT_ASSET, person_who_holds_the_potato, person_who_gets_the_potato)
                console.log(transaction.toXDR());
                resolve(transaction.toXDR());
                return transaction.toXDR();
              })
              .catch((err) => {
                console.log(err);
              });
          }
        });
    });
  };
  