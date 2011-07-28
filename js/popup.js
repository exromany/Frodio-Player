function popupOnLoad() {
  window.main = chrome.extension.getBackgroundPage();
  main.verifyUser(setList, setPlayer);
  document.body.innerHTML = tmpl('body', {'body_inner': tmpl('body_inner', {
    'volume' : main.volume,
    'played' : main.played ? 'playing' : '',
    'active_1' : (main.sort == 1) ? 'active' : '',
    'active_2' : (main.sort == 2) ? 'active' : '',
    'active_3' : (main.sort == 3) ? 'active' : '',
    'active_4' : (main.view == 0) ? 'active' : '',
    'active_5' : (main.view == 1) ? 'active' : '',
    'active_6' : (main.api.user) ? (main.sort == 4) ? 'active' : '' : 'disabled'
  }) });
  window.stations_scroll = document.getElementById('scroll');
  window.stations_scroll_inner = document.getElementById('scroll_inner');
  window.stations_ = document.getElementById('stations_inner');
  stations_scroll.onscroll = function() { stations_.scrollTop = stations_scroll.scrollTop; }
  stations_.onscroll = function() { stations_scroll.scrollTop = stations_.scrollTop; }
  document.getElementById('player_button').onclick = playButton;
  document.getElementById('player_volume_range').onmouseup = function(event) {main.setVolume(event.target.value);};
  document.getElementById('sort_1').onclick = function () {sortSelect(1);};
  document.getElementById('sort_2').onclick = function () {sortSelect(2);};
  document.getElementById('sort_3').onclick = function () {sortSelect(3);};
  document.getElementById('sort_4').onclick = function () {sortSelect(4);};
  document.getElementById('view_0').onclick = function () {viewSelect(0);};
  document.getElementById('view_1').onclick = function () {viewSelect(1);};
  setList.call(main.api);
  setPlayer.call(main.api, true);
  setInterval(updateList, 1000*10);
  updateList(true);
}

function setPlayer(forceUpdate) {
  var station = this.stations[this.current];
  if (station.updated || forceUpdate || main.needUpdate) {
    station.updated = false;
    main.needUpdate = false;
    var player = {
      'link'       : station.link,
      'title'      : station.name,
      'track_link' : (this.loaded && station.track_link) ? 'href="' + station.track_link + '"' : '',
      'track_pic'  : (this.loaded && station.track_pic) ? station.track_pic : 'images/frodio.png', 
      'events'     : 'onerror="this.src = \'images/pic.png\';"',
      'track'      : this.loaded ? station.track  : '...',
      'artist'     : this.loaded ? station.artist : chrome.i18n.getMessage(this.error ? 'cant_connect' : 'connecting', this.host),
      'options'    : (!this.loaded || !station.urls) ? '' : tmpl('options', {
        'active'  : this.user ? station.liked ? 'active' : '' : 'disabled',
        'share_t' : station.urls.share_twitter,
        'share_f' : station.urls.share_facebook,
        'share_g' : station.urls.share_buzz,
        'share_v' : station.urls.share_vkontakte,
        'like_events' : 'onclick="likeClick();"'
      })
    }
    if (station.removed) with (player) {
      track_pic = 'images/track_pic.png';
      track_link = '';
      track = '...';
      artist = chrome.i18n.getMessage('station_removed');
      options = '';
    }
    document.getElementById('player_content').innerHTML = tmpl('player_inner', player);
    document.getElementById('player_button').className = main.played ? 'playing' : '';
  }
}

function setList() {
  if (this.stations) {
    this.hasNewLogo = false;
    // сортировка
    if ((!this.user || !this.loaded) && main.sort == 4) {
      sortSelect(main.storage.get('sort') || 1);
    }
    this.sort(main.sort);
    // построение списка
    var code = '';
    var view = (main.view == 0) ? 'station' : 'table_station';
    var last = this.count(main.sort == 4) % 3;
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      if (main.sort != 4 || this.stations[key].fav) {
        var track = '';
        if (this.loaded) {
          track = main.artistPlusTrack(key);
        }
        code += tmpl(view, {
          'link' : this.stations[key].link, 
          'title': this.stations[key].name,
          'track': track,
          'events': 'onclick="stationClick('+key+', event);"',
          'active': (this.user && this.loaded) ? this.stations[key].fav ? 'active' : '' : 'disabled',
          'class': i >= this.count(main.sort == 4) - last ? last == 1 ? 'one' : 'two' : '',
          'img': this.stations[key].img ? 
            tmpl('table_station_img', {
              'img': 'http://frodio.com/s/'+this.stations[key].link+'/logo_small.'+this.stations[key].img 
            }) : 
            tmpl('table_station_text', {
              'title': this.stations[key].name
            })
        });
      }
    }
    if (this.count() > 1) {
      code += tmpl('last_station', {
        'events': 'onclick="stationClick(0,event);"',
        'count' : this.count()
      });
    }
    document.getElementById('stations_inner').innerHTML = code;
    setScrollHeight();
    if (this.user && this.loaded)
      document.getElementById('sort_4').classList.remove('disabled');
    else
      document.getElementById('sort_4').classList.add('disabled');
    main.storage.set('stations', this.stations);
    main.storage.set('order', this.order);
  }
}

function updateTracks() {
  if (this.stations) {
    setPlayer.call(this);
    if (this.hasNew || (this.hasNewLogo && main.view == 1)) {
      setList.call(this);
    } else {
      for (var i = 0; i < this.order.length; i++) {
        var key = this.order[i];
        if (main.sort != 4 || this.stations[key].fav) {
          var track = main.artistPlusTrack(key);
          //if (this.stations[key].updated)
          if (main.view == 0) {
            document.getElementById('station_'+this.stations[key].link).innerHTML = track;
            if (this.user && this.loaded)
              updateStationFav(key);
          } else
            document.getElementById('t_station_'+this.stations[key].link).title = this.stations[key].name + "\n" + track;
        }
      }
      setScrollHeight();
    }
  }
}

function updateList(forceUpdate) {
  main.api.getStations(forceUpdate, updateTracks);
}

function stationClick(id, event) {
  if (event) {
    if (event.target.tagName != 'A') {
      if (id == 0) {
        id = main.api.random();
      }
      main.setStation(id);
      main.api.stations[id].toUpdate = true;
      setPlayer.call(main.api, true);
      document.getElementById('player_button').classList.add('playing');
    } else if (!event.target.href) {
      updateStationFav(id, true);
      main.api.setLikeStation(id, setList);
    }
  }
}

function playButton() {
  if (main.played) {
    document.getElementById('player_button').className = '';
    main.stop();
  } else {
    document.getElementById('player_button').className = 'playing';
    main.play();
  }
  return false;
}

function sortSelect(opt) {
  main.sort = opt;
  document.getElementById('sort_1').classList.remove('active');
  document.getElementById('sort_2').classList.remove('active');
  document.getElementById('sort_3').classList.remove('active');
  document.getElementById('sort_4').classList.remove('active');
  document.getElementById('sort_'+opt).classList.add('active');
  setList.call(main.api);  
  stations_.scrollTop = 0; 
  if (opt < 4)
    main.storage.set('sort', opt);
}

function viewSelect(opt) {
  main.view = opt;
  document.getElementById('view_0').classList.remove('active');
  document.getElementById('view_1').classList.remove('active');
  document.getElementById('view_'+opt).classList.add('active');
  setList.call(main.api);
  stations_.scrollTop = 0; 
  main.storage.set('view', opt);
}

function likeClick() {
  if (main.api.user) {
    main.api.setLike(function () {
      setPlayer.call(this);
    });
  }
  return false;
}

function updateStationFav(id, before) {
  var t = document.getElementById('fav_station_'+main.api.stations[id].link);
  if (main.api.stations[id].fav ? !before : before) {
    t.classList.add('active');
    t.title = chrome.i18n.getMessage('unlike_station');
  } else {
    t.classList.remove('active');
    t.title = chrome.i18n.getMessage('like_station');
  }
}

function setScrollHeight() {
  stations_scroll.classList.remove('hide');
  stations_scroll_inner.style.setProperty('height',stations_.scrollHeight+'px');
  if (stations_scroll_inner.scrollHeight < 350)
    stations_scroll.classList.add('hide');
}
