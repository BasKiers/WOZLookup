'use strict';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type == "get-wozwaardeloket-cookie") {
		requestWOZ(request, sendResponse);
		return true;
	}
});

function refreshCookie(callback) {
	chrome.cookies.remove({ url: 'https://www.wozwaardeloket.nl', name: 'JSESSIONID' }, function () {
		chrome.cookies.remove({ url: 'https://www.wozwaardeloket.nl/woz-proxy/wozloket', name: 'JSESSIONID' }, function () {
			var cookieReq = new XMLHttpRequest();
			var cookieUrl = "https://www.wozwaardeloket.nl";
			cookieReq.open("HEAD", cookieUrl, true);

			//Send the proper header information along with the request
			cookieReq.withCredentials = true;

			cookieReq.onreadystatechange = function () {//Call a function when the state changes.
				if (cookieReq.readyState == 4 && cookieReq.status == 200) {
					// console.log(cookieReq.getResponseHeader('Set-Cookie'));
					callback();
				} else if (cookieReq.readyState == 4) {
					callback(new Error('Could not get cookie'));
				}
			}
			cookieReq.send();
		});
	});
}

function getLocationId(query, callback) {
	var queryReq = new XMLHttpRequest();
	var queryUrl = "https://www.wozwaardeloket.nl/api/geocoder/v2/suggest?query=" + encodeURI(query);
	queryReq.open("GET", queryUrl, true);

	//Send the proper header information along with the request
	queryReq.withCredentials = true;

	queryReq.onreadystatechange = function () {//Call a function when the state changes.
		if (queryReq.readyState == 4) {
			if (queryReq.status == 200) {
				var queryResult = JSON.parse(queryReq.responseText);
				if (queryResult && queryResult.docs && queryResult.docs[0]) {
					callback(queryResult.docs[0].id.match(/0(\d*)-/)[1]);
				} else {
					callback(null);
				}
			} else {
				callback(null);
			}
		}
	};
	queryReq.send();
}

function requestWOZ(request, sendResponse) {
	refreshCookie(function () {
		getLocationId(request.options.query, function (locationId) {
			if (!locationId) return;

			var wozReq = new XMLHttpRequest();
			var wozUrl = "https://www.wozwaardeloket.nl/woz-proxy/wozloket";
			var wozParams = `<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" service="WFS" version="1.1.0"
                xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<wfs:Query typeName="wozloket:woz_woz_object" srsName="EPSG:28992" xmlns:WozViewer="http://WozViewer.geonovum.nl"
	           xmlns:ogc="http://www.opengis.net/ogc">
		<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
			<ogc:And>
				<ogc:PropertyIsEqualTo matchCase="true">
					<ogc:PropertyName>wobj_bag_obj_id</ogc:PropertyName>
					<ogc:Literal>${locationId}</ogc:Literal>
				</ogc:PropertyIsEqualTo>
			</ogc:And>
		</ogc:Filter>
	</wfs:Query>
</wfs:GetFeature>`;
			wozReq.open("POST", wozUrl, true);

			//Send the proper header information along with the request
			wozReq.setRequestHeader("Content-type", "text/xml");
			wozReq.setRequestHeader("Accept", "application/json");
			wozReq.withCredentials = true;

			wozReq.onreadystatechange = function () {//Call a function when the state changes.
				if (wozReq.readyState == 4 && wozReq.status == 200) {
					sendResponse(JSON.parse(wozReq.responseText));
				}
			};
			wozReq.send(wozParams);
		})
	});
}