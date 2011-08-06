function backgroundOnLoad() {
  chrome.browserAction.setBadgeBackgroundColor({'color':[0,255,0,50]});
  window.storage = new Storage();
  window.api = new FrodioAPI();
  window.station = storage.get('station') || "1";
  api.stations[station] = storage.get('station_info') || {'name':'Station 2.0', 'link':'station20', 'track_pic':'http://frodio.com/img/artist.png', 'img':'gif'};
  api.order.push(station);
  window.volume = 1;
  getCookie('volume', function(e) {volume = e});
  window.played = false;
  window.swfActive = false;
  window.view = storage.get('view') || 0;
  window.sort = storage.get('sort') || 1;
}

function play(restart) {
  if (!played) {
    document.body.innerHTML = tmpl( 'radio', {'volume': volume, 'stream':api.streams + api.stations[station].link} );
    if (document.getElementById('swfradio').setVolume) {
      swfActive = true;
    }
    if (!restart) {
      // uodate badge
      chrome.browserAction.setBadgeText({'text':'Play'});
      // set cookie
      setCookie('paused','0');
      // start update current station
      window.intervalId = setInterval( updateCurrent, 1000*10 );
      updateCurrent();
    }
    played = true;
  }
}

function stop(restart) {
  if (played) {
    document.body.innerHTML = '';
    if (!restart) {
      // update badge
      chrome.browserAction.setBadgeText({'text':''});
      // set cookie
      setCookie('paused','1');
      // stop updating current station
      clearInterval(intervalId);
    }
    played = false;
  }
}

function updateCurrent() {
  api.updateOnAir(station);
}

function restart() {
  if (played) {
    stop(true);
    play(true);
  }
}

function setVolume(vol, swf) {
  if (!swf || swfActive) {
    if (volume != vol) {
      volume = vol;
      setCookie('volume', vol);
      if (swf) {
        document.getElementById('swfradio').setVolume(volume);
      } else {
        restart();
      }
    }
  }
}

function setStation(id) {
  if (station != id || !played) {
    station = id;
    if (played) {
      stop(true);
      play(true);
    } else {
      play();
    }
    storage.set('station', id);
    //storage.set('station_info', api.stations[id]);
  }
}

function setLike() {
  if (api.stations[station].like_link) {
    
  }
}
