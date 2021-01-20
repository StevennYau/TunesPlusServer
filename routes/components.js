const { response } = require('express')
const express = require('express')
var request = require("request")
const app = express()
const port = 5000
const axios = require ('axios');
require('dotenv').config();

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { globalAgent } = require('http')


var token = globalToken;
console.log('current use access token: '+ globalToken);

app.get("/home", (req, res) => {
  token = globalToken;
  console.log('global token: ' + globalToken);
  var config = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + token,
     "Access-Control-Allow-Origin": "*"
    }
  };
  axios.get('https://api.spotify.com/v1/me', config)
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
        console.log('Error', error.message);
      }
    })
    .then(function (resp) {
     // res.send(resp.data.categories.items[0].name);
      console.log(resp.data);
      res.send(resp.data.display_name);
    })
})



app.get("/getGenre", (req, res) => {
  token = globalToken;
  console.log('genre token: ' + token);
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
        console.log('Error', error.message);
      }
    })
    .then(function (resp) {
     // res.send(resp.data.categories.items[0].name);
      console.log(resp.data.categories.items);
      let temp = resp.data.categories.items;
      temp = temp.map(item => item.name);
      console.log(temp);
      console.log("sent genres");
      res.send(temp);
    })
})

app.get("/getNewReleases", (req, res) => {
  token = globalToken;
  var header = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + token,
     "Access-Control-Allow-Origin": "*"
    }
  };
  var param = {
    params: {
      "country": "SE"
    } 
  }
  axios.get('https://api.spotify.com/v1/browse/new-releases?country=SE', header, param)
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
        console.log('Error', error.message);
      }
    })
    .then(function (resp) {
      console.log(resp.data.albums.items);
      let releases = [];
      for (let i = 0; i < resp.data.albums.items.length; i++){
        releases.push(resp.data.albums.items[i].name);
      }
      res.send(releases);
    })
})

app.get("/getGlobal50", (req, res) => {
  token = globalToken;
  var header = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + token,
     "Access-Control-Allow-Origin": "*"
    }
  };

  axios.get('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF', header)
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
        console.log('Error', error.message);
      }
    })
    .then(function (resp) {
      console.log(resp.data.tracks.items[0].track.name);
      let tracks = [];
      for (let i = 0; i < resp.data.tracks.items.length; i++){
        tracks.push(resp.data.tracks.items[i].track.name);
      }
      res.send(tracks);
    })
})
