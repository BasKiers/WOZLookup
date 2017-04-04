if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('checkPage');
  checkPageButton.addEventListener('click', function() {
    chrome.tabs.getSelected(null, function(tab) {
    chrome.extension.getBackgroundPage().console.log('foo');
      tab.console.log('TEST');
      var cookieReq = new XMLHttpRequest();
      var cookieUrl = "https://www.wozwaardeloket.nl/index.jsp?a=1&accept=true&";
      cookieReq.open("HEAD", wozUrl, true);

      //Send the proper header information along with the request
      cookieReq.setRequestHeader('Access-Control-Allow-Origin', '*');

      cookieReq.onreadystatechange = function() {//Call a function when the state changes.
        if(cookieReq.readyState == 4 && cookieReq.status == 200) {
          tab.console.log(cookieReq.getResponseHeader('Set-Cookie'));
        }
      }
      cookieReq.send();
  }, false);
}, false);
