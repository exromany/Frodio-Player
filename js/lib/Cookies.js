function setCookie(name, value) {
  var details = {'url'   : api.protocol + api.host + '/',
                 'name'  : name,
                 'value' : value,
                 'domain': '.'+api.host,
                 'path'  : '/'};
  chrome.cookies.set(details);
}

function getCookie(name, callback) {
  var details = {'url' : api.protocol + api.host + '/',
                 'name': name};
  chrome.cookies.get(details, function(cookie) {
    if (cookie) {
      callback.call(this, cookie.value);
    }
  });
}
