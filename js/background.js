function backgroundOnLoad() {
  chrome.browserAction.setBadgeBackgroundColor({'color':[0,255,0,50]});
  chrome.browserAction.setBadgeText({'text':''});
  window.api = new FrodioAPI();
  window.storage = new Storage();
  window.cookie = new Cookie(api);
  window.volume = 1;
  init();
  verifyUser();
  chrome.extension.onRequest.addListener(keyHook);
}

function init() {
  api.stations = storage.get('stations') || {'1':{ 'name':'Station 2.0', 'link':'station20', 'img':'gif'} };
  api.current = storage.get('station') || "1";
  if (!api.stations[api.current]) api.current = 1;
  api.order = storage.get('order') || [1];
  api.loaded = false;
  api.error = false;
  cookie.get('volume', function(e) {volume = e || storage.get('volume') || 1});
  window.view = storage.get('view') || 0;
  window.sort = storage.get('sort') || 1;
  window.needUpdate = false; // обновить плеер после шорткатов
  window.played = false;
  // get options
  window.opt_scrobble = storage.get('scrobble') || true;
  window.opt_notification = storage.get('notification') || false;
  window.opt_seconds = storage.get('seconds') || 3;
  // shortcuts
  window.shortcuts = storage.get('shortcuts') || [ null, null, null];
  // end options
}

function verifyUser(callback, callback2) {
  cookie.get('frodio', function(e) {
    api.user = e ? true : false;
    if (callback) callback.call(api);
    if (callback2) callback2.call(api);
    // set cookie +1 month
    if (e) {
      var d = new Date;
      var m = d.getUTCMonth();
      cookie.set('frodio', e, (d.setUTCMonth(m+1) / 1000).toFixed()-0 );
    }
  });
}

function play(restart) {
  if (!played) {
    document.body.innerHTML = tmpl( 'radio', {'volume': volume, 'stream':api.streams + api.stations[api.current].link} );
    if (!restart) {
      // uodate badge
      chrome.browserAction.setBadgeText({'text':'Play'});
      // set cookie
      if (opt_scrobble)
        cookie.set('paused','0');
    }
    // start update current station
    window.intervalId = setInterval( updateCurrent, 1000*10 );
    updateCurrent(true);
    setTitle();
    played = true;
  }
}

function stop(restart) {
  if (played) {
    document.body.innerHTML = '';
    if (!restart) {
      // update badge
      chrome.browserAction.setBadgeText({'text':''});
      chrome.browserAction.setTitle({'title': 'Frodio Player'});
      // set cookie
      cookie.set('paused','1');
    }
    // stop updating current station
    clearInterval(intervalId);
    played = false;
  }
}

function restart() {
  if (played) {
    stop(true);
    play(true);
  }
}

function setVolume(vol) {
  if (volume != vol) {
    volume = vol;
    cookie.set('volume', vol);
    storage.set('volume', vol);
    restart();
  }
}

function setStation(id) {
  if (api.current != id || !played) {
    api.current = id;
    if (played) {
      stop(true);
      play(true);
    } else {
      play();
    }
    storage.set('station', id);
  }
}

function updateCurrent(withoutNotify) {
  api.updateOnAir(withoutNotify ? null : notify);
}

function notify() {
  if (opt_notification) {
    with (api.stations[api.current])
      customNotify(track_pic, name, artistPlusTrack(api.current), opt_seconds);
  }
  setTitle();
}

function customNotify(pic, title, message, sec) {
  var n = webkitNotifications.createNotification(pic, title, message);
  n.ondisplay = function() {
    setTimeout(function () { n.cancel(); }, (sec || 3)  * 1000);
  }
  n.show();
}

function setTitle() {
  with (api.stations[api.current])
    chrome.browserAction.setTitle({'title': name+'\n'+artist+'\n'+track});
}

function artistPlusTrack(key) {
  var track = '';
  if (api.stations[key].artist) track = api.stations[key].artist;
  if (track && api.stations[key].track) track += ' — ';
  if (api.stations[key].track) track += api.stations[key].track;
  if (!track) track = '[Без названия]'; // to messages.json
  return track;
}

function keyHook(request, sender) {
  for (var key in shortcuts) {
    if (shortcuts[key]) {
      if (shortcuts[key].alt === request.key.alt && 
          shortcuts[key].ctrl === request.key.ctrl && 
          shortcuts[key].meta === request.key.meta && 
          shortcuts[key].shift === request.key.shift &&  
          shortcuts[key].code === request.key.code) {
        var next = false;
        if (!api.loaded) 
          api.getStations(true);
        switch (key-0) {
          case 0 :
            if (!played) {
              play();
              notify();
            }
            else next = true;
            break;
          case 1 :
            if (played) stop();
            else next = true;
            break;
          case 2 :
            setStation(api.random());
            notify();
            break;
        }
        if (!next) {
          needUpdate = true;
          break;
        }
      }
    }
  }
}
