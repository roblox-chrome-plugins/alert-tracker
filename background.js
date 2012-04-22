function AlertInfo(obj) {
	for(var key in obj)
		this[key] = obj[key];
	
	this.getValueString = function() {
		var _000 = 1000; //Bodged thousand separator
		if(this.value === null) return '?';
		return (
			this.value <        1*_000 ? Math.round(this.value) :
			this.value <       10*_000 ? Math.round(this.value / 10) / 100 + 'K' :
			this.value <      100*_000 ? Math.round(this.value / 100) / 10 + 'K' :
			this.value <   1*_000*_000 ? Math.round(this.value / 1000)     + 'K' :
			this.value <  10*_000*_000 ? Math.round(this.value / 10000) / 100 + 'M' :
			this.value < 100*_000*_000 ? Math.round(this.value / 100000) / 10 + 'M' :
									     Math.round(this.value / 1000000)     + 'M');
	}
	
	this.getFullMessage = function() {
		return this.getValueString() + ' ' + this.notify[1] + (this.value == 1 ? '' : 's');
	}
	this.getShortMessage = function() {
		return this.getValueString() + this.notify[0];
	}
}

var alerts = [
	new AlertInfo({
		name: 'Messages',
		selector: '.MessageAlertCaption',
		value: null,
		url: 'http://www.roblox.com/My/Inbox.aspx',
		color: [68, 68, 68, 255],
		notify: ['m', 'new message'],
		className: 'messages'
	}),
	new AlertInfo({
		name: 'Friend Requests',
		selector: '.FriendsAlertCaption',
		value: null,
		url: 'http://www.roblox.com/User.aspx?submenu=true#friendreqs',
		color: [0, 85, 187, 255],
		notify: ['fr', 'friend request'],
		className: 'friends'
	}),
	new AlertInfo({
		name: 'ROBUX',
		selector: '.RobuxAlertCaption',
		value: null,
		url: 'http://www.roblox.com/My/AccountBalance.aspx',
		color: [0, 136, 0, 255],
		className: 'robux'
	}),
	new AlertInfo({
		name: 'Tickets',
		selector: '.TicketsAlertCaption',
		value: null,
		url: 'http://www.roblox.com/My/AccountBalance.aspx',
		color: [170, 102, 17, 255],
		className: 'tickets'
	})
];

var badges = [];

var poller = (function() {
	var intervalId = null;
	var time = 1000 * 60 * 15; // 15 minutes default
	var p = {};
	p.__defineGetter__("time", function() {
        return time;
    });
    p.__defineSetter__("time", function(val) {
		if(val == null || val < 1000) return;
		
		time = +val;
		if(intervalId !== null) clearInterval(intervalId);
		intervalId = setInterval(function() { alerts.update(); }, time);
		alerts.update();
    });
	return p;
})();

var authentication = (function() {
	var loggedIn = null;
	
	var a = {
		onLogIn: function() { console.log("Logged In"); },
		onLogOut: function() { console.log("Logged Out"); }
	};
	a.__defineGetter__("loggedIn", function() {
        return loggedIn;
    });
	a.__defineSetter__("loggedIn", function(val) {
        if(val === loggedIn) return
		loggedIn = val;
		if(val === true) this.onLogIn();
		else if(val === false) this.onLogOut();
    });
	return a;
})();

(function doBrowserActionDisplay() {
	var interval = null,
	    badgeIndex = null;
	
	var getTitle = function () {
		var titleArray = badges.map(function(b) { return b.getFullMessage(); });
		var title = titleArray[titleArray.length - 1];
		if (titleArray.length > 1) {
			title = titleArray.slice(0, -1).join(', ') + ', and ' + title;
		}
		return title;
	};
	
	authentication.onLogOut = function () {
		badgeIndex = null;
		clearInterval(interval);
		
		chrome.browserAction.setBadgeText({text: 'X'});
		chrome.browserAction.setTitle({title: 'Not logged in'});
		chrome.browserAction.setBadgeBackgroundColor({color: [128, 128, 128, 255]});
	};
	authentication.onLogIn = function () {		
		badgeIndex = 0;
		showBadges();
		interval = setInterval(showBadges, 5000);
	};
	
	var showBadges = function () {
		if (badgeIndex >= badges.length) {
			badgeIndex = 0;
		}
		chrome.browserAction.setTitle({title: getTitle()});
		
		if (badges.length == 0) {
			chrome.browserAction.setBadgeText({text: ''});
		} else {
			var badge = badges[badgeIndex];
			chrome.browserAction.setBadgeText({text: badge.getShortMessage()});
			chrome.browserAction.setBadgeBackgroundColor({color: badge.color});
			badgeIndex++;
		}
	}
	
})();

function getNotification(callback) {	
	alerts.update(function () {
		var elems;
		if(authentication.loggedIn) {
			elems = $(alerts).map(function () {
				return $('<a />')
					.attr('href', this.url)
					.attr('title', this.name)
					.addClass('alert').addClass(this.className)
					.text(this.getValueString())
					.get(0);
			});
		}
		else {
			elems = $('<div />').addClass('error').text('Not logged in').append(
				$('<a />').attr('href', 'http://www.roblox.com/Login/Default.aspx').text('Login')
			);
		}
		callback(elems);
	});
}

alerts.updateFrom = function(alertBox) {
	var isLoggedIn = alertBox.size() > 0;

	if(isLoggedIn) {
		badges = this.filter(function(alert) {
			alert.value = alertBox.find(alert.selector).text()
				.replace(/K\+/gi, '000')
				.replace(/M\+/gi, '000000')
				.replace(/G\+/gi, '000000000')
				.replace(/[^0-9]/g, '');
			return alert.notify && alert.value > 0;
		});
	} else {
		badges = [];
		this.forEach(function(alert) {
			alert.value = null;
		});
	}
	authentication.loggedIn = isLoggedIn;
}

alerts.update = function(callback) {
	$.get(
		'http://www.roblox.com/User.aspx?ID=921458',
		function(data) {
			//remove images and jQuerify
			var alertBox = $(data.replace(/<img/gi, '<dontdoit')).find('#Alerts');
			alerts.updateFrom(alertBox)
			if(callback) callback();
		}
	);
}

//Update the alerts whenever a roblox page is loaded
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if(request.action == "update") {
		//remove images and jQuerify
		var alertBox = $(request.page.replace(/<img/gi, '<dontdoit'));
		alerts.updateFrom(alertBox)
	}
});

function goToAlertPage(url) {
	chrome.tabs.getAllInWindow(undefined, function (tabs) {
		var exists = false;
		$(tabs).each(function () {
			if (this.url && 0 == this.url.indexOf(url)) {
				exists = this.id;
				return;
			}
		});
		
		if(exists != false)
			chrome.tabs.update(exists, {selected: true});
		else
			chrome.tabs.create({url: url});
	});
}

$(window).bind('storage', function (e) {
	e = e.originalEvent;
	if(e.key == 'pollTime') poller.time = e.newValue;
});

poller.time = localStorage.pollTime;
