/**
* This is the main Node.js server script for your project
* Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
*/

const path = require("path");
const contract = require("./contract.js")
const fs = require("fs")
const { checkSignatures } = require('./utils/confirm-signature.js')
const { getOwner } = require('./utils/get-owner.js')
const { Keypair, Networks } = require("stellar-sdk");
require("dotenv").config();
const Sentry = require("@sentry/node");

// Importing @sentry/tracing patches the global hub for tracing to work.
const SentryTracing = require("@sentry/tracing");

Sentry.init({
  dsn: "https://5b13749d395b45e8a65a82648a8e1a39@o1192160.ingest.sentry.io/6313755",
  tracesSampleRate: 1.0,
});

const network = Networks.PUBLIC

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

fastify.register(require('fastify-cors'), { 
  // put your options here
  origin: false,     
})

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE


// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/**
* Our home page route
*
* Returns src/pages/index.hbs with data built into it
*/
fastify.get("/", function(request, reply) {
  reply.view("/public/index.html",);
});

/**
* Our POST route to handle and react to form submissions 
*
* Accepts body data indicating the user choice
*/

fastify.get("/generate_xdr", async function(request, reply){
    let source = request.query.source
    let destination = request.query.destination
    
    //console.log(source)
    //console.log(destination)
    let resp = {}
    
    
      contract.getXDR({source: source, destination: destination}).then((data) => {
        console.log(data)
        resp["xdr"] = data

        reply.raw.writeHead(200, { 'Content-Type': 'text/json', 'Access-Control-Allow-Origin': '*' })
        reply.raw.write(JSON.stringify(resp))
        reply.raw.end()

      }).catch(err => {
        resp["err"] = err.toString()
        console.log(err)
        
        reply.raw.writeHead(400, { 'Content-Type': 'text/json', 'Access-Control-Allow-Origin': '*' })
        reply.raw.write(JSON.stringify(resp))
        reply.raw.end()
      })
    
    
  
      /*reply.raw.writeHead(200, { 'Content-Type': 'text/json' })
      reply.raw.write(JSON.stringify({"err": "nesh"}))
      reply.raw.end()*/
  
  
})

fastify.get('/timeline', function(request,reply){
  reply.view("/public/timeline.html")
})

fastify.get('/lobstr-vault', function(request,reply){
  reply.view("/public/lobstr.html")
})

fastify.get('/complete-pass', function(request,reply){
  reply.view("/public/complete_pass.html")
})

fastify.get('/static/utils.js', function(request,reply){
  reply.view("/static/utils.js")
})

fastify.post('/storeTransaction', async function (request, reply) {
  // Get current Owner
  const owner = getOwner(process.env.PUBLIC_KEY)
  
  // Check if Destination Key is correct
  try {
    Keypair.fromPublicKey(request.body.destination);
  } catch (err) {
      reply.serialize({"err":"Invalid Public Key for Destination"});
  }
  
  // Check if XDR is valid
  try {
    if(checkSignatures(request.body.xdr, network, owner)){
        // Check if it contains the current potato holder's signature
        console.log(request.body)
        console.log(request.body.xdr)
        reply.serialize({"hi":"mom"});
    } else {
        reply.serialize({"err":"There wasn't a signature for the source account. If you're using multisignature wallets make sure to include the source wallet's signature as well."});
      }
    } catch(err) {
    // Invalid Transaction most probably
    reply.serialize({"err": err})
  }
})


fastify.get('/.well-known/stellar.toml', function(request,reply){
  const stream = fs.createReadStream("public/stellar.toml")
  reply.raw.writeHead(200, { 'Access-Control-Allow-Origin': '*' })
  reply.type('text').send(stream)
})

// Run the server and report out to the logs
fastify.listen(process.env.PORT, '0.0.0.0', function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
