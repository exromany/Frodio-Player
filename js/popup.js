function popupOnLoad() {
  //var css = document.createElement("link");
  //css.setAttribute("rel", "stylesheet");
  //css.setAttribute("type", "text/css");
  //css.setAttribute("href", "css/dark.css");
  //document.head.appendChild(css);
  window.main = chrome.extension.getBackgroundPage();
  document.body.innerHTML = tmpl('body', {'body_inner': tmpl('body_inner', {
    'volume': main.volume,
    'active_1': (main.sort == 1) ? 'active' : '',
    'active_2': (main.sort == 2) ? 'active' : '',
    'active_3': (main.sort == 3) ? 'active' : '',
    'active_4': (main.view == 0) ? 'active' : '',
    'active_5': (main.view == 1) ? 'active' : ''
  }) });
  if (main.played) {
    document.getElementById('player_button').classList.add('playing');
  }
  document.getElementById('player_button').onclick = playButton;
  document.getElementById('player_volume_range').onmouseup = function(event) {main.setVolume(event.target.value);};
  document.getElementById('player_volume_range').onchange = function(event) {main.setVolume(event.target.value, true);};
  document.getElementById('sort_1').onclick = function () {sortSelect(1);};
  document.getElementById('sort_2').onclick = function () {sortSelect(2);};
  document.getElementById('sort_3').onclick = function () {sortSelect(3);};
  document.getElementById('view_0').onclick = function () {viewSelect(0);};
  document.getElementById('view_1').onclick = function () {viewSelect(1);};
  setList.call(main.api);
  setPlayer.call(main.api.stations[main.station], true);
  setInterval(updateList, 1000*10);
  updateList(true);
}

function setPlayer(forceUpdate) {
  if (this.updated || forceUpdate) {
    this.updated = false;
    var player = {
      'link'       : this.link,
      'title'      : this.name,
      'track_link' : this.track_link,
      'track_pic'  : this.track_pic,
      'track'      : this.track,
      'artist'     : this.artist,
      'options'    : ''
    }
    if (this.urls) {
      player['options'] = tmpl('options', {
        'active'  : (this.liked) ? 'active' : '',
        'title'   : (this.liked) ? 'unlike' : 'like',
        'share_t' : this.urls.share_twitter,
        'share_f' : this.urls.share_facebook,
        'share_g' : this.urls.share_buzz,
        'share_v' : this.urls.share_vkontakte,
        'like_events' : 'onclick="likeClick();"'
      })
    }
    document.getElementById('player_content').innerHTML = tmpl('player_inner', player);
    main.storage.set('station_info', this);
  }
}

function setList() {
  if (this.stations) {
    this.hasNewLogo = false;
    // сортировка
    this.sort(main.sort);
    // построение списка
    var code = '';
    var view = (main.view == 0) ? 'station' : 'table_station';
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      code += tmpl(view, {
        'link' : this.stations[key].link, 
        'title': this.stations[key].name,
        'track': this.stations[key].artist + ' — ' + this.stations[key].track,
        'events': 'onclick="stationClick('+key+', event);"',
        'img': (this.stations[key].img) ? 'http://frodio.com/s/'+this.stations[key].link+'/logo_small.'+this.stations[key].img : 'images/no-logo.png'
      });
    }
    if (this.count() > 1) {
      code += tmpl('last_station', {
        'events': 'onclick="stationClick(0,event);"',
        'count' : this.count(),
        'class' : (main.view == 0) ? 'list' : 'last'
      });
    }
    document.getElementById('stations').innerHTML = tmpl('stations_list', {'station': code});
  }
}

function updateTracks() {
  if (this.stations) {
    setPlayer.call(this.stations[main.station]);
    if (this.hasNew || (this.hasNewLogo && main.view == 1)) {
      setList.call(this);
    } else {
      if (main.view == 0) {
        for (var key in this.stations) 
          //if (this.stations[key].updated)
            document.getElementById('station_'+this.stations[key].link).innerHTML = 
              this.stations[key].artist + ' — ' + this.stations[key].track;
      } else {
        for (var key in this.stations) 
          //if (this.stations[key].updated)
            document.getElementById('t_station_'+this.stations[key].link).title = 
              this.stations[key].name+"\n"+this.stations[key].artist + ' — ' + this.stations[key].track;
      }
    }
  }
}

function updateList(forceUpdate) {
  main.api.getStations(main.station, forceUpdate, updateTracks);
}

function stationClick(id, event) {
  if (event) {
    if (event.target.tagName != 'A') {
      if (id == 0) {
        id = main.api.random(main.station);
      }
      main.setStation(id);
      main.api.stations[id].toUpdate = true;
      setPlayer.call(main.api.stations[main.station], true);
      document.getElementById('player_button').classList.add('playing');
    }
  }
}

function playButton() {
  if (main.played) {
    document.getElementById('player_button').classList.remove('playing');
    main.stop();
  } else {
    document.getElementById('player_button').classList.add('playing');
    main.play();
  }
  return false;
}

function sortSelect(opt) {
  main.sort = opt;
  document.getElementById('sort_1').classList.remove('active');
  document.getElementById('sort_2').classList.remove('active');
  document.getElementById('sort_3').classList.remove('active');
  document.getElementById('sort_'+opt).classList.add('active');
  setList.call(main.api);  
  main.storage.set('sort', opt);
}

function viewSelect(opt) {
  main.view = opt;
  document.getElementById('view_0').classList.remove('active');
  document.getElementById('view_1').classList.remove('active');
  document.getElementById('view_'+opt).classList.add('active');
  setList.call(main.api);
  main.storage.set('view', opt);
}

function likeClick() {
  main.api.setLike(main.station, function () {
    setPlayer.call(this.stations[main.station]);
  });
  return false;
}
