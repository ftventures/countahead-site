/* Countahead site runtime: renders the page template from component state, then patches the DOM in place. */
(function () {
  var HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
  function lookup(path, scopes) {
    var parts = path.split("."), v, i;
    for (i = scopes.length - 1; i >= 0; i--) {
      var sc = scopes[i];
      if (sc && typeof sc === "object" && parts[0] in sc) { v = sc[parts[0]]; break; }
    }
    for (i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function holePath(s) { var m = /\{\{\s*([\w.$]+)\s*\}\}/.exec(s || ""); return m ? m[1] : ""; }
  function fill(str, scopes) {
    if (str.indexOf("{{") < 0) return str;
    return str.replace(HOLE, function (m, p) { var v = lookup(p, scopes); return v == null ? "" : String(v); });
  }
  function number(tplRoot) {
    var n = 0, list = tplRoot.querySelectorAll("sc-for,sc-if");
    for (var i = 0; i < list.length; i++) list[i].__id = "k" + (n++);
  }
  function renderKids(t, out, scopes, ctx, prefix) {
    for (var c = t.firstChild; c; c = c.nextSibling) renderNode(c, out, scopes, ctx, prefix);
  }
  function keyed(t, out, scopes, ctx, key) {
    var before = out.childNodes.length;
    renderKids(t, out, scopes, ctx, key);
    for (var i = before, c = 0; i < out.childNodes.length; i++) {
      var n = out.childNodes[i];
      if (n.nodeType === 1 && !n.hasAttribute("data-k")) n.setAttribute("data-k", key + (c++));
    }
  }
  function renderNode(t, out, scopes, ctx, prefix) {
    var doc = ctx.doc;
    if (t.nodeType === 3) { out.appendChild(doc.createTextNode(fill(t.data, scopes))); return; }
    if (t.nodeType !== 1) return;
    var tag = t.localName;
    if (tag === "sc-for") {
      var list = lookup(holePath(t.getAttribute("list")), scopes) || [], as = t.getAttribute("as");
      for (var i = 0; i < list.length; i++) { var s = {}; s[as] = list[i]; keyed(t, out, scopes.concat([s]), ctx, prefix + t.__id + "_" + i + "/"); }
      return;
    }
    if (tag === "sc-if") {
      if (lookup(holePath(t.getAttribute("value")), scopes)) keyed(t, out, scopes, ctx, prefix + t.__id + "/");
      return;
    }
    var el = doc.createElementNS(t.namespaceURI, tag);
    for (var a = 0; a < t.attributes.length; a++) {
      var at = t.attributes[a], name = at.name;
      if (name.toLowerCase() === "onclick") {
        var fn = lookup(holePath(at.value), scopes);
        ctx.handlers.push(fn); el.setAttribute("data-on", String(ctx.handlers.length - 1));
      } else el.setAttribute(name, fill(at.value, scopes));
    }
    renderKids(t, el, scopes, ctx, prefix);
    out.appendChild(el);
  }
  function key(n) { return n.nodeType === 1 ? n.getAttribute("data-k") : null; }
  function patch(a, b) {
    if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; return; }
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i]; if (!b.hasAttribute(at.name)) a.removeAttribute(at.name); }
    for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    if (a.hasAttribute("data-widget")) return;
    patchKids(a, b);
  }
  function patchKids(a, b) {
    var map = {}, n, cur = a.firstChild, kids = [], k;
    for (n = a.firstChild; n; n = n.nextSibling) { k = key(n); if (k != null) map[k] = n; }
    for (n = b.firstChild; n; n = n.nextSibling) kids.push(n);
    for (var i = 0; i < kids.length; i++) {
      var bn = kids[i], bk = key(bn), match = null;
      if (bk != null) match = map[bk] && map[bk].nodeName === bn.nodeName ? map[bk] : null;
      else { n = cur; while (n && key(n) != null) n = n.nextSibling; if (n && n.nodeType === bn.nodeType && n.nodeName === bn.nodeName) match = n; }
      if (match) {
        if (match !== cur) a.insertBefore(match, cur); else cur = cur.nextSibling;
        patch(match, bn);
      } else a.insertBefore(bn, cur);
    }
    while (cur) { n = cur.nextSibling; a.removeChild(cur); cur = n; }
  }
  function mount(doc, tplRoot, appEl, Comp, props) {
    number(tplRoot);
    var inst = new Comp(); inst.props = props || {}; inst.state = {};
    var ctx = { doc: doc, handlers: [] }, queued = false;
    function render() {
      queued = false; ctx.handlers = [];
      var frag = doc.createElement("div");
      renderKids(tplRoot, frag, [inst.renderVals()], ctx, "");
      patchKids(appEl, frag);
    }
    inst.setState = function (p) {
      for (var k in p) inst.state[k] = p[k];
      if (queued) return; queued = true;
      (typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout)(render);
    };
    appEl.__click = function (e) {
      var t = e.target; while (t && t !== appEl && !(t.getAttribute && t.hasAttribute("data-on"))) t = t.parentNode;
      if (t && t !== appEl) { var fn = ctx.handlers[+t.getAttribute("data-on")]; if (typeof fn === "function") fn(e); }
    };
    render();
    return inst;
  }
  window.CA = { mount: mount };
})();
