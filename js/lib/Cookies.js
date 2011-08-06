function Cookie(api) {
  _api = api;
}

Cookie.prototype.set = function (name, value, expDate) {
  var details = {'url'   : _api.protocol + _api.host + '/',
                 'name'  : name,
                 'value' : value,
                 'domain': '.'+_api.host,
                 'path'  : '/'};
  if (expDate) details.expirationDate = expDate;
  chrome.cookies.set(details);
}

Cookie.prototype.get = function (name, callback) {
  var details = {'url' : _api.protocol + _api.host + '/',
                 'name': name};
  chrome.cookies.get(details, function(cookie) {
    callback.call(this, cookie ? cookie.value : null);
  });
}
