const { response } = require('express')
const express = require('express')
var request = require("request")
const app = express()
const port = 5000
const axios = require ('axios');
require('dotenv').config();

const token = process.env.ACCESS_TOKEN;

app.get("/getGenre", (req, res) => {
  var config = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + token,
     "Access-Control-Allow-Origin": "*"
    }
  };
  axios.get('https://api.spotify.com/v1/browse/categories', config)
    .catch(function (error) {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      }else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("EROORRRORORO!!");
        console.log('Error', error.message);
      }
    })
    .then(function (resp) {
      res.send(resp.data.categories.items[0].name);
      console.log(resp.data.categories.items[0].name);
      console.log("sent!");
      return resp.data.categories.items[0].name;
    })
})


app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})