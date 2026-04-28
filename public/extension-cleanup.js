/* eslint-disable */
// Strips DOM attributes injected by Bitdefender, Grammarly, and similar
// browser extensions so React's hydration check stays quiet in dev. Runs
// once on parse + keeps observing because extensions re-inject as the page
// renders.
(function () {
  var BAD_ATTRS = [
    'bis_skin_checked',
    'bis_register',
    'bis_use',
    'data-bis-config',
    'data-new-gr-c-s-check-loaded',
    'data-gr-ext-installed',
  ];
  var BAD_PREFIX = '__processed_';

  function clean(node) {
    if (!node || node.nodeType !== 1) return;
    for (var i = 0; i < BAD_ATTRS.length; i++) {
      if (node.hasAttribute && node.hasAttribute(BAD_ATTRS[i])) {
        node.removeAttribute(BAD_ATTRS[i]);
      }
    }
    if (node.attributes) {
      for (var j = node.attributes.length - 1; j >= 0; j--) {
        var a = node.attributes[j];
        if (a && a.name && a.name.indexOf(BAD_PREFIX) === 0) {
          node.removeAttribute(a.name);
        }
      }
    }
    var c = node.firstChild;
    while (c) {
      clean(c);
      c = c.nextSibling;
    }
  }

  clean(document.documentElement);

  if (typeof MutationObserver === 'undefined') return;
  var obs = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'attributes' && m.target && m.target.removeAttribute) {
        var n = m.attributeName || '';
        if (BAD_ATTRS.indexOf(n) >= 0 || n.indexOf(BAD_PREFIX) === 0) {
          try {
            m.target.removeAttribute(n);
          } catch (e) {}
        }
      } else if (m.type === 'childList') {
        for (var k = 0; k < m.addedNodes.length; k++) clean(m.addedNodes[k]);
      }
    }
  });

  function start() {
    if (document.body) {
      obs.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    } else {
      setTimeout(start, 16);
    }
  }
  start();
})();
