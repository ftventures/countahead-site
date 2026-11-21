/* Keeps a range slider alive while a widget re-renders around it, so dragging is smooth. */
(function () {
  if (typeof Element === "undefined") return;
  var d = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!d || !d.set) return;
  function attrs(o, n) { [].slice.call(o.attributes).forEach(function (a) { if (!n.hasAttribute(a.name)) o.removeAttribute(a.name); }); [].slice.call(n.attributes).forEach(function (a) { if (a.name !== "value" && o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value); }); }
  function sync(o, n, path) {
    if (!path.length) { attrs(o, n); return true; }
    var i = path[0], oc = o.childNodes[i], nc = n.childNodes[i];
    if (!oc || !nc || oc.nodeType !== 1 || nc.nodeType !== 1 || oc.nodeName !== nc.nodeName) return false;
    if (!sync(oc, nc, path.slice(1))) return false;
    if (path.length > 1) attrs(oc, nc);
    while (o.firstChild !== oc) o.removeChild(o.firstChild);
    while (o.lastChild !== oc) o.removeChild(o.lastChild);
    var before = [], after = [], seen = false;
    [].slice.call(n.childNodes).forEach(function (c) { if (c === nc) seen = true; else (seen ? after : before).push(c); });
    before.forEach(function (c) { o.insertBefore(c, oc); }); after.forEach(function (c) { o.appendChild(c); });
    return true;
  }
  Object.defineProperty(Element.prototype, "innerHTML", { configurable: true, enumerable: d.enumerable, get: d.get, set: function (html) {
    var a = document.activeElement;
    if (a && a !== this && a.nodeName === "INPUT" && a.type === "range" && this.contains(a)) {
      var path = [], x = a; while (x !== this) { path.unshift([].indexOf.call(x.parentNode.childNodes, x)); x = x.parentNode; }
      var t = document.createElement(this.nodeName === "TBODY" ? "tbody" : "div"); d.set.call(t, html);
      var probe = t, ok = true; path.forEach(function (i) { probe = probe && probe.childNodes[i]; if (!probe) ok = false; });
      if (ok && probe.nodeName === "INPUT" && probe.type === "range") {
        if (!a.__keep) { a.__keep = true; var add = a.addEventListener; a.addEventListener = function (type) { if (type === "input") return; return add.apply(a, arguments); }; a.focus = function () {}; }
        if (sync(this, t, path)) return;
      }
    }
    d.set.call(this, html);
  } });
})();
