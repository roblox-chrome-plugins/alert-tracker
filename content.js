$(function() {
	var alerts = $('.AlertSpace').get(0);
	alerts = alerts ? alerts.outerHTML: null;
	chrome.extension.sendRequest({
		action: 'update',
		page: alerts
	});
});