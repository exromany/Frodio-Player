function fpSetHook(object) {
  object.addEventListener('keydown', function(e) { 
    if (!e) e = window.event;
    var key = {
      'alt'  : e.altKey,
      'ctrl' : e.ctrlKey,
      'meta' : e.metaKey,
      'shift': e.shiftKey,
      'code' : e.keyCode
    };
    if (key.code != 18 && key.code != 17 && key.code != 16 && key.code != 224 )
      chrome.extension.sendRequest({'key': key});
  });
}
fpSetHook(document);
