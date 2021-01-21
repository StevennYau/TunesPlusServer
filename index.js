const { response } = require('express')
const express = require('express')
var request = require("request")
const port = 5000
const axios = require ('axios');
require('dotenv').config();
var router = express.Router();

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { globalAgent } = require('http')
const { nextTick } = require('process')
var indexRouter = require('./routes/redirect');
const app = express();



// LOGIN / AUTHORIZATION CODE ///////////////////////////////////////////////////////////////////////////
var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = 'http://localhost:5000/callback/'; // Your redirect uri
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter


  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        res.cookie('userToken', access_token);
        res.cookie('refreshToken', refresh_token);

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          //console.log('USER INFORMATION: ' + body);
          //console.log(body);
        });
        
        // we can also pass the token to the browser to make requests from there
        res.redirect('http://localhost:3000/home');

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
// END OF LOGIN / AUTHORIZATION CODE ///////////////////////////////////////////////////////////////////////////

app.use('/testing', indexRouter);

app.get('/#access_token+end', (req, res) => {
  res.send("hello");
})

app.get("/home", (req, res) => {
  var userInfo = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + req.cookies.userToken,
     "Access-Control-Allow-Origin": "*"
    }
  };
  var currentSongParam = {
    params: {
      "market": "ES",
      "additional_types": "episode"
    }
  }
  var topSongs = {
    params: {
      "time_range": "long_term",
      "limit": "50",
      "offset": "5"
    }
  }
  var topArtists = {
    params: {
      "time_range": "long_term",
      "limit": "10",
      "offset": "5"
    }
  }
  axios.all([
    axios.get('https://api.spotify.com/v1/me', userInfo),
    axios.get('https://api.spotify.com/v1/me/player/currently-playing?market=ES&additional_types=episode', 
    userInfo, currentSongParam),
    axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50&offset=5', userInfo,
    topSongs),
    axios.get('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=10&offset=5', userInfo,
    topArtists)
  ])
  .then(axios.spread((userInfo, currentPlaying, topSongs, topArtists) => {
    let songs = [];

    for (let i = 0; i < topSongs.data.items.length - 1; i ++){
      songs.push(topSongs.data.items[i].name);
    }

    let songImages = [];
    for (let i = 0; i < topSongs.data.items.length - 1; i ++){
      songImages.push(topSongs.data.items[i].album.images[1].url);
    }
    
    console.log(songImages);

    let artists = [];
    artists = topArtists.data.items.map(item => item.name);
    
    let artistsImages = [];
    artistsImages = topArtists.data.items.map(item => item.images[1].url);

    let final = [userInfo.data, currentPlaying.data, songs, artists, artistsImages, songImages];
    res.send(final);
  }))
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
})



app.get("/getGenre", (req, res) => {
  var config = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + req.cookies.userToken,
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
  var header = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + req.cookies.userToken,
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
  var header = {
    headers: {
     "Content-Type": "application/json",
     "Accept": "application/json",
     "Authorization": "Bearer " + req.cookies.userToken,
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



app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})