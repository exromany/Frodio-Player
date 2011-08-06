function FrodioAPI () {
  this.host = 'frodio.com';
  this.protocol = 'http://';
  this.onair = '/onair.json';
  this.streams = 'http://frod.io:8000/';
  this.escRE = /([\(\)\[\]\\\.\^\$\|\?\+\*])/g;
  this.hasNew = true;
  this.stations = {};
  this.order = [];
  this.count = function () {
    var c = 0;
    for (var key in this.stations)
      c += 1;
    return c;
  }
  this.random = function (current) {
    var count = this.count();
    if (count > 1) {
      var r;
      do {
        r = Math.floor(Math.random() * count) + 1;
        var i = 0;
        for (var key in this.stations) {
          if (++i == r) {
            r = key;
            break;
          }
        }
      } while (r == current)
      return r;
    }  
  }
  this.sort = function(opt) {
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
}

FrodioAPI.prototype.ajax = function(url, param, callback) {
  var xhr = new XMLHttpRequest();
  var self = this;
  var method = "GET";
  var opt = false;
  var opt2 = false;
  if (param) {
    method = param.method || method;
    opt = param.opt || opt;
    opt2 = param.opt2 || opt2;
  }
  xhr.open(method, url, true);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.timeout = 1000*2;
  xhr.send(null);
  xhr.onload = function (e) {
    if (callback) {
      callback.call(self, xhr, opt, opt2);
    }
  }
  xhr.onerror = function() {
    //alert('error on xhr'); // todo: надо что то сделать с этим
  }
}

FrodioAPI.prototype.getStations = function (currentId, forceUpdate, callback) {
  this.ajax( this.protocol + this.host + this.onair + "?all=1", null, function (xhr){
    if (xhr && xhr.status == 200) {
      //document.body.innerHTML = xhr.responseText;
      var json = JSON.parse(xhr.responseText);
      this.hasNew = false;
      var temp = {};
      for (var key in json) {
        temp[key] = true;
        if (!this.stations[key]) {
          this.stations[key] = {};
          this.order.push(key-0);
          this.hasNew = true;
          var re = new RegExp("^Liked "+
            (json[key].track.title+'').replace(this.escRE, "\\$1")+" by "+
            (json[key].artist.name+'').replace(this.escRE, "\\$1")+" on (.*)$");
          this.stations[key].name = json[key].like.text.replace(re, "$1");
          this.stations[key].link = json[key].link.replace(/^http:\/\/(.*)\.frodio\.com.*/, "$1");
          this.ajax(this.protocol + this.host + '/s/' + this.stations[key].link + '/logo_small.png', {'opt':key}, function(xhr, key){
            if (xhr.status == 200) {
              this.stations[key].img = 'png';
              this.hasNewLogo = true;
            } else {
              this.ajax(this.protocol + this.host + '/s/' + this.stations[key].link + '/logo_small.gif', {'opt':key}, function(xhr, key){
                if (xhr.status == 200) {
                  this.stations[key].img = 'gif';
                  this.hasNewLogo = true;
                }
              })
            }
          });
        }
        if (this.stations[key].id != json[key].id || forceUpdate || this.stations[key].toUpdate) {
          this.stations[key].id         = json[key].id;
          this.stations[key].updated    = true;
          this.stations[key].toUpdate   = false;
          this.stations[key].track      = json[key].track.title;
          this.stations[key].track_link = json[key].link;
          this.stations[key].track_pic  = json[key].artist.img;
          this.stations[key].artist     = json[key].artist.name;
          this.stations[key].like_link  = json[key].like.link;
          this.stations[key].listener   = json[key].listener;
          this.stations[key].urls       = json[key].urls;
          if (key == currentId) {
            this.ajax( this.protocol + this.stations[key].link + '.' + this.host + this.stations[key].like_link, 
                {'opt': key, 'opt2':this.stations[key].id}, function(xhr, key, id) {
              if (xhr && xhr.status == 200 && id == this.stations[key].id) {
                var json_like = JSON.parse(xhr.responseText);
                this.stations[key].liked = (json_like.like) ? true : false;
                this.stations[key].updated = true;
              }
            });
          }
        }
      }
      // проверим, нет ли отключенных станций
      for (var key in this.stations) {
        if (!temp[key]) {
          delete this.stations[key];
          this.order.splice(this.order.indexOf(key-0), 1);
          this.hasNew = true;
        }
      }

      callback.call(this);
    }
  })
}

FrodioAPI.prototype.updateOnAir = function (key) {
  this.ajax( this.protocol + this.stations[key].link + '.' + this.host + this.onair );
}

FrodioAPI.prototype.setLike = function (key, callback) {
  this.ajax( this.protocol + this.stations[key].link + '.' + this.host + this.stations[key].like_link, 
      {'method':'POST', 'opt':key, 'opt2':this.stations[key].id}, function(xhr, key, id){
    if (xhr.status == 200) {
      if (id == this.stations[key].id) {
        var json = JSON.parse(xhr.responseText);
        if (json.ok) {
          this.stations[key].liked = (json.sign == '+');
          this.stations[key].updated = true;
          callback.call(this);
        }
      }
    }
  } );
}
