// Mozilla DNT Helper
/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */
if (typeof Mozilla === "undefined") {
  var Mozilla = {};
}
Mozilla.dntEnabled = function (dnt, ua) {
  "use strict";
  var dntStatus =
    dnt || navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  var userAgent = ua || navigator.userAgent;
  var anomalousWinVersions = [
    "Windows NT 6.1",
    "Windows NT 6.2",
    "Windows NT 6.3",
  ];
  var fxMatch = userAgent.match(/Firefox\/(\d+)/);
  var ieRegEx = /MSIE|Trident/i;
  var isIE = ieRegEx.test(userAgent);
  var platform = userAgent.match(/Windows.+?(?=;)/g);
  if (isIE && typeof Array.prototype.indexOf !== "function") {
    return false;
  } else if (fxMatch && parseInt(fxMatch[1], 10) < 32) {
    dntStatus = "Unspecified";
  } else if (
    isIE &&
    platform &&
    anomalousWinVersions.indexOf(platform.toString()) !== -1
  ) {
    dntStatus = "Unspecified";
  } else {
    dntStatus = { 0: "Disabled", 1: "Enabled" }[dntStatus] || "Unspecified";
  }
  return dntStatus === "Enabled" ? true : false;
};
// Load GA unless DNT is enabled.
if (Mozilla && !Mozilla.dntEnabled()) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-36116321-5', { 'anonymize_ip': true });
  gtag('config', 'G-PWTK27XVWP', { 'anonymize_ip': true });

  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=UA-36116321-5';
  document.head.appendChild(gaScript);
}
