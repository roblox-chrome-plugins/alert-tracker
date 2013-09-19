var bkg = chrome.extension.getBackgroundPage();
$('a').live('click',function(){
	var url = $(this).attr('href');
	bkg.goToAlertPage(url);
	window.close();
});
function updatePage() {
	bkg.getNotification(function(notification) {
		$('#info').empty().append(notification);
	});
}
updatePage();
