function Storage () {
}

Storage.prototype.set = function (key, value) {
  localStorage[key] = JSON.stringify( value )
}

Storage.prototype.get = function (key) {
  var code = localStorage[key];
  if ( code && code.length ) {
    return eval( '(' + code + ')' );
  }
  else {
    return null;
  }
}

Storage.prototype.clear = function (key) {
  localStorage.removeItem(key);
}

Storage.prototype.clearAll = function () {
  localStorage.clear();
}
