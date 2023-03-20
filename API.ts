const express = require('express')

var app = express();
app.use(express.json());

import { ChatGPTAPI } from 'chatgpt'

const { promisify } = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);

app.post('/', async(req, res) => {

  if(!req.get("Authorization"))
  {
    res.send({
      "statusCode": 400,
      "statusText": "No API Key provided.",
  })
    return
  }
  const APIKey: string = req.get("Authorization").split(" ")[1]

  try
  {
    const api = new ChatGPTAPI({ apiKey: APIKey })

    const InstructionSet = await readFile("Content/GPTInstructions.txt", "utf-8");

    let GPTResponse = await api.sendMessage(InstructionSet)
    let GPTJSONResponse = JSON.parse(GPTResponse.text)
    try 
    {
      if(GPTJSONResponse["Status"] != "Ready") { res.send(GPTJSONResponse); return }
      console.log("GPT is ready to receive messages")
  
      var JSONSet = -"\nBEGIN OF EXECUTABLE TASKS\n" + JSON.stringify(req.body) + "\nEND OF EXECUTABLE TASKS"
      GPTResponse = await api.sendMessage(JSONSet, {
        conversationId: GPTResponse.conversationId,
        parentMessageId: GPTResponse.id
      })

      console.log("GPT Response: " + GPTResponse.text)
  
      res.send(JSON.parse(GPTResponse.text))
    }
    catch (error)
    {
      res.send(error)
    }
  }
  catch(error)
  {
    res.send(error)
  }
  
})

var Server = null;
var port = 0
if(process.argv[2] == "--ssl")
{ 
  const https = require('https')
  const PrivateKeyPath = 'Content/SSL/privkey.pem'
  const CertificatePath = 'Content/SSL/cert.pem'
  
  if(!fs.existsSync(PrivateKeyPath) || !fs.existsSync(CertificatePath)) { console.log("No SSL Certificate found, make sure that SSL/privkey.pem and SSL/cert.pem are present."); process.kill(process.pid, 'SIGINT'); }
  
  var PrivateKey = fs.readFileSync('Content/SSL/privkey.pem', 'utf8');
  var Certificate = fs.readFileSync('Content/SSL/cert.pem', 'utf8');
  
  port = 443
  const Credentials = {key: PrivateKey, cert: Certificate};
  Server = https.createServer(Credentials, app);
}

else
{
  port = 80
  const http = require('http')
  Server = http.createServer(app);
}

if(Server != null)
{
  Server.listen(port, () => {
    console.log(`GPT app listening on port ${port}`)
  })
}
else
{
  console.log("No Server created, due to missing Server object.")
  process.kill(process.pid, 'SIGINT');
}