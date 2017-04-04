'use strict';

var WOZCache = {};
var inserting = false;
var insertDebounceTimeout;

function insertWOZValues(query, priceElem, price, cb) {
	if (priceElem.querySelector('table')) return;

	inserting = true;
	var callback = function () {
		clearTimeout(insertDebounceTimeout);
		insertDebounceTimeout = setTimeout(function () {
			inserting = false;
		}, 100);
		if (cb) {
			cb.apply(this, arguments);
		}
	};

	var parseWOZResult = function (result) {
		if (result && Array.isArray(result.features)) {
			var container = document.createElement('table');
			var titleRow = document.createElement('tr');
			var titleHead = document.createElement('th');
			var title = document.createTextNode('WOZ Waarde:');
			titleHead.appendChild(title);
			titleRow.appendChild(titleHead);
			container.appendChild(titleRow);
			result.features.reverse().forEach(function (feature) {
				console.log('append child', priceElem, feature.properties.wobj_wrd_woz_waarde);

				var row = document.createElement('tr');
				var dateData = document.createElement('td');
				var priceData = document.createElement('td');
				var deviationData = document.createElement('td');
				var dateText = document.createTextNode(feature.properties.wobj_wrd_peildatum.slice(-4));
				var wozPrice = Number(feature.properties.wobj_wrd_woz_waarde);
				var wozText = document.createTextNode(feature.properties.wobj_wrd_woz_waarde.slice(0, -3) + '.' + feature.properties.wobj_wrd_woz_waarde.slice(-3));
				var deviation = Math.round((wozPrice - price) / price * 1000) / 10;
				var deviationText = document.createTextNode(deviation + '%');

				dateData.appendChild(dateText);
				priceData.appendChild(wozText);
				deviationData.appendChild(deviationText);

				row.appendChild(dateData);
				row.appendChild(priceData);
				row.appendChild(deviationData);

				container.appendChild(row);

				if (deviation < 0) {
					deviationData.style.color = 'red';
				} else if (deviation > 0) {
					deviationData.style.color = 'green';
				}
				deviationData.style['padding-left'] = '1em';
			});
			priceElem.appendChild(container);
		}
		callback();
	};

	if (WOZCache[query]) {
		parseWOZResult(WOZCache[query]);
	} else {
		chrome.runtime.sendMessage({ type: "get-wozwaardeloket-cookie", options: { query: query } }, function (result) {
			WOZCache[query] = result;
			parseWOZResult(result);
		});
	}
}

function getSearchElementsWOZ(elements) {
	var elem = elements.shift();
	if (!elem) return;

	var titleElem = elem.querySelector('.search-result-title');
	var priceElem = elem.querySelector('.search-result-price');
	var price = Number(priceElem.innerHTML.replace(/[^\d]/g, ''));
	var query = titleElem.innerHTML.replace(/<[^>]*>/g, ' ').replace(/\n/g, '').replace(/\s\s/g, '').trim();

	insertWOZValues(query, priceElem, price, getSearchElementsWOZ.bind(this, elements));
}

function getOverviewElementWOZ() {
	var element = document.querySelector('.object-header-details');

	if (!element) return;

	var titleElem = element.querySelector('.object-header-title');
	var priceElem = element.querySelector('.object-header-price');
	var price = Number(priceElem.innerHTML.replace(/[^\d]/g, ''));
	var query = titleElem.innerHTML.replace(/<[^>]*>/g, ' ').replace(/\n/g, '').replace(/\s\s/g, '').trim();

	insertWOZValues(query, priceElem, price);
}

function getJaapSearchElementsWOZ(elements) {
	var elem = elements.shift();
	if (!elem) return;

	var titleElem = elem.querySelector('.property-address-street');
	var subtitleElem = elem.querySelector('.property-address-zipcity');
	var priceElem = elem.querySelector('.property-price');
	var price = Number(priceElem.innerHTML.replace(/[^\d]/g, ''));
	var query = titleElem.innerHTML + ' ' + subtitleElem.innerHTML;

	insertWOZValues(query, priceElem, price, getJaapSearchElementsWOZ.bind(this, elements));
}

function getJaapOverviewElementWOZ() {
	var element = document.querySelector('.detail-address');

	if (!element) return;

	var titleElem = element.querySelector('.detail-address-street');
	var subtitleElem = element.querySelector('.detail-address-zipcity');
	var priceElem = element.querySelector('.detail-address-price');
	var price = Number(priceElem.innerHTML.replace(/[^\d]/g, ''));
	var query = titleElem.innerHTML + ' ' + subtitleElem.innerHTML;

	insertWOZValues(query, priceElem, price);
}

function calculateElements() {
	var hostname = window.location.hostname;
	var searchElements;

	if (hostname.indexOf('funda') !== -1) {
		searchElements = Array.from(document.querySelectorAll('.search-result-content-inner'));
		getSearchElementsWOZ(searchElements);

		getOverviewElementWOZ();
	} else if (hostname.indexOf('jaap') !== -1) {
		searchElements = Array.from(document.querySelectorAll('.property-info'));
		getJaapSearchElementsWOZ(searchElements);

		getJaapOverviewElementWOZ();
	}
}

document.body.addEventListener('DOMSubtreeModified', function () {
	if (!inserting) {
		calculateElements();
	}
}, false);
calculateElements();