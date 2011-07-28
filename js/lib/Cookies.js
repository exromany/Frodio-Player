function setCookie(name, value, expDate) {
  var details = {'url'   : api.protocol + api.host + '/',
                 'name'  : name,
                 'value' : value,
                 'domain': '.'+api.host,
                 'path'  : '/'};
  if (expDate) details.expirationDate = expDate;
  chrome.cookies.set(details);
}

function getCookie(name, callback) {
  var details = {'url' : api.protocol + api.host + '/',
                 'name': name};
  chrome.cookies.get(details, function(cookie) {
    callback.call(this, cookie ? cookie.value : null);
  });
}
