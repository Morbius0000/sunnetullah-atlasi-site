// Rebuilds window.ATLAS_DATA from split source chunks.
(function () {
  var source = (window.__ATLAS_PUBLIC_SOURCE || []).join("");
  window.__ATLAS_PUBLIC_SOURCE = null;
  (0, eval)(source);
}());
