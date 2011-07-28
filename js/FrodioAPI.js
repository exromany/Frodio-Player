function FrodioAPI () {
  this.host = 'frodio.com';
  this.protocol = 'http://';
  this.onair = '/onair.json';
  this.streams = 'http://frod.io:8000/';
  this.escRE = /([\(\)\[\]\\\.\^\$\|\?\+\*])/g;
  this.hasNew = true;
  this.stations = {};
  this.current = 1;
  this.order = [];
  this.loaded = false; // получен ли хоть раз список станций
  this.user = false;
}

FrodioAPI.prototype.count = function (fav) {
  if (fav) {
    var count = 0;
    for (var i = 0; i < this.order.length; i++) {
      count += this.stations[this.order[i]].fav ? 1 : 0;
    }
    return count;
  } else return this.order.length;
}

FrodioAPI.prototype.random = function () {
  var count = this.count();
  if (count > 1) {
    var r;
    do {
      r = Math.floor(Math.random() * count);
      r = this.order[r];
    } while (r == this.current)
    return r;
  }  
}

FrodioAPI.prototype.sort = function(opt) {
var stations = this.stations;
  this.order.sort(function(a, b){
    var c;
    switch (opt) { 
      case 1: // по популярности
        c = stations[b].listener - stations[a].listener;
        if (c != 0) break;
      case 2: // по алфавиту
        c = (stations[a].name < stations[b].name) ? -1 : 1;
        break;
      default: // по порядку
        c = a - b;
    }
    return c;
  });
}

FrodioAPI.prototype.ajax = function(url, param, callback) {
  var xhr = new XMLHttpRequest();
  var self = this;
  var method = "GET";
  var opt = {};
  if (param) {
    method = param.method || method;
    opt = param.opt || opt;
  }
  xhr.open(method, url, true);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send(null);
  xhr.onload = function() {
    if (callback) 
      callback.call(self, xhr, opt);
  }
  xhr.onerror = function() {
    if (callback) 
      callback.call(self, xhr, opt);
  }
}

FrodioAPI.prototype.getStations = function (forceUpdate, callback) {
  this.ajax( this.protocol + this.host + this.onair + "?all=1", null, function (xhr){
    if (xhr && xhr.status == 200) {
      var json = JSON.parse(xhr.responseText);
      this.hasNew = false;
      var temp = {};
      for (var key in json) {
        temp[key] = true;
        if (!this.stations[key] || this.stations[key].removed || !this.loaded) {
          this.hasNew = true;
          if (!this.stations[key]) {
            this.order.push(key-0);
            this.stations[key] = {};
          }
          var re = new RegExp("^Liked "+
            (json[key].track.title+'').replace(this.escRE, "\\$1")+" by "+
            (json[key].artist.name+'').replace(this.escRE, "\\$1")+" on (.*)$");
          this.stations[key].name = json[key].like.text.replace(re, "$1");
          this.stations[key].link = json[key].link.replace(/^http:\/\/(.*)\.frodio\.com.*/, "$1");
          this.stations[key].removed = false;
          //this.stations[key].fav = false;
          // get small logo
          this.ajax(this.protocol + this.host + '/s/' + this.stations[key].link + '/logo_small.png', {'opt':{'key':key, 'img':'png'} }, function (xhr, opt) {
            if (xhr.status == 200) {
              this.stations[opt.key].img = opt.img;
              this.hasNewLogo = true;
            } else {
              this.ajax(this.protocol + this.host + '/s/' + this.stations[opt.key].link + '/logo_small.gif', {'opt':{'key':opt.key, 'img':'gif'} }, function (xhr, opt) {
                if (xhr.status == 200) {
                  this.stations[opt.key].img = opt.img;
                } else {
                  this.stations[opt.key].img = null;
                }
                this.hasNewLogo = true;
              });
            }
          });
          // end get small logo
        }
        this.getInfo(key, json[key], forceUpdate);
      }
      // проверим, нет ли отключенных станций
      for (var key in this.stations) {
        if (!temp[key]) {
          this.stations[key].removed = true;
          this.order.splice(this.order.indexOf(key-0), 1);
          this.hasNew = true;
        }
      }
      this.loaded = true;
      this.error = false;
    } else {
      this.error = true;
    }
    if (callback) callback.call(this);
  })
}

FrodioAPI.prototype.getInfo = function (key, json, forceUpdate) {
  if (this.stations[key].id != json.id || forceUpdate || this.stations[key].toUpdate) {
    this.stations[key].id         = json.id;
    this.stations[key].updated    = true;
    this.stations[key].toUpdate   = false;
    this.stations[key].track      = json.track.title;
    this.stations[key].track_link = json.link;
    this.stations[key].track_pic  = json.artist.img;
    this.stations[key].artist     = json.artist.name;
    this.stations[key].like_link  = json.like.link;
    this.stations[key].listener   = json.listener;
    this.stations[key].urls       = json.urls;
    // get liked
    if (this.user && key == this.current) {
      this.ajax( this.protocol + this.stations[key].link + '.' + this.host + this.stations[key].like_link, 
          {'opt': {'key':key, 'id':this.stations[key].id} }, function(xhr, opt) {
        if (xhr && xhr.status == 200 && opt.id == this.stations[opt.key].id) {
          var json_like = JSON.parse(xhr.responseText);
          this.stations[opt.key].liked = (json_like.like) ? true : false;
          this.stations[opt.key].updated = true;
        }
      });
    }
    // end get liked
    // get favorites stations
    if (this.user) {
      this.ajax( this.protocol + this.host + '/station/' + this.stations[key].link + '/like', 
          {'opt': {'key':key} }, function(xhr, opt) {
        if (xhr && xhr.status == 200) {
          var json_like = JSON.parse(xhr.responseText);
          var tmp = (json_like.like) ? true : false;
          if (this.stations[opt.key].fav != tmp) {
            this.stations[opt.key].fav = tmp;
            this.stations[opt.key].updated = true;
          }
        }
      });
    }
    // end get favorites stations
  }
}

FrodioAPI.prototype.updateOnAir = function (callback) {
  this.ajax( this.protocol + this.stations[this.current].link + '.' + this.host + this.onair, {'opt':{'key':this.current} }, function (xhr, opt) {
    if (xhr && xhr.status == 200) {
      var json = JSON.parse(xhr.responseText);
      var id = this.stations[this.current].id;
      this.getInfo(opt.key, json);
      if (id != this.stations[this.current].id && callback)
        callback.call(this);
    }
  });
}

FrodioAPI.prototype.setLike = function (callback) {
  this.ajax( this.protocol + this.stations[this.current].link + '.' + this.host + this.stations[this.current].like_link, 
      {'method':'POST', 'opt': {'key':this.current, 'id':this.stations[this.current].id} }, function(xhr, opt){
    if (xhr.status == 200) {
      if (opt.id == this.stations[opt.key].id) {
        var json = JSON.parse(xhr.responseText);
        if (json.ok) {
          this.stations[opt.key].liked = (json.sign == '+');
          this.stations[opt.key].updated = true;
          callback.call(this);
        }
      }
    }
  } );
}

FrodioAPI.prototype.setLikeStation = function (key, callback) {
  this.ajax( this.protocol + this.host + '/station/' + this.stations[key].link + '/like', 
      {'method':'POST', 'opt': {'key':key }}, function(xhr, opt){
    if (xhr.status == 200) {
        var json = JSON.parse(xhr.responseText);
        if (json.ok) {
          var tmp = (json.sign == '+');
          if (tmp != this.stations[opt.key].fav) {
            this.stations[opt.key].fav = tmp;
            this.stations[opt.key].updated = true;
          }
        callback.call(this);
      }
    }
  } );
}
