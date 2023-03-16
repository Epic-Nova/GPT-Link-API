const express = require('express')
var app = express();
const port = 80
app.use(express.json());

import { ChatGPTAPI } from 'chatgpt'

const { promisify } = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);

app.post('/', async(req, res) => {

  const APIKey = req.headers.authorization.split(' ')[1]
  if(APIKey == null) { res.send({ "Status": "NoAPIKey", "Message": "No API Key provided" }); return; }

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

    res.send(JSON.parse(GPTResponse.text))
  }
  catch (error)
  {
    res.send(error)
  }
  
})

app.listen(port, () => {
  console.log(`GPT app listening on port ${port}`)
})