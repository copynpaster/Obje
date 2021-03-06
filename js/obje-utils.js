var xmlHttpRequest;
var onloadcallback;

$(document).ready(initialize);

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results == null) return null;
	return results[1] || 0;
}

function initialize() {
	if (window.XMLHttpRequest)
		xmlHttpRequest = new XMLHttpRequest();
	else if (window.ActiveXObjct)
		xmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	else
		xmlHttpRequest = null;
}

function loadXmlData(path, callback) {
	if (null == xmlHttpRequest) {
		initialize();
	}

	onloadcallback = callback;
	xmlHttpRequest.onreadystatechange = handleStateChange;
	xmlHttpRequest.open("GET", path, true);
	xmlHttpRequest.send(null);
}

function handleStateChange() {
	if (null == onloadcallback) return;

	if (XMLHttpRequest.DONE == xmlHttpRequest.readyState && 200 == xmlHttpRequest.status) {
		var xmlData = xmlHttpRequest.responseXML;
		onloadcallback(xmlData);
	}
}

function fullScreen() {
	$(document).toggleFullScreen();
}

function computeVOffset(element) {
	var windowHeight = $(window).height();
	var elementHeight = $(element).height();

	//console.log("computeVOffset : " + windowHeight + " / " + elementHeight);

	if ( windowHeight < elementHeight ) {
		$(element).css({
			'top' : '0',
			'-webkit-transform': 'translateY(0%)',
			'-ms-transform': 'translateY(0%)',
			'transform': 'translateY(0%)'
		});
	} else {
		// need to filter out the top 50% case
		$(element).css({
			'top' : '50%',
			'-webkit-transform': 'translateY(-50%)',
			'-ms-transform': 'translateY(-50%)',
			'transform': 'translateY(-50%)'
		});
	}
}

function addPageContents(container, slideInfo, languageCode) {
	var textNodeList = slideInfo.getElementsByTagName("text");
	var imageInfo = slideInfo.getElementsByTagName("image")[0];
	var imageInfo2x = slideInfo.getElementsByTagName("image2x")[0];
	var imagePath = null;
	var imagePath2x = null;
	var contents = null;

	if (null != imageInfo) imagePath = imageInfo.childNodes[0].nodeValue;
	if (null != imageInfo2x) imagePath2x = imageInfo2x.childNodes[0].nodeValue;
	if (null != textNodeList && textNodeList.length > 0) {
		for (var idx = 0; idx < textNodeList.length; idx++) {
			if ( textNodeList[idx].getAttribute('language') == languageCode ) {
				contents = textNodeList[idx].childNodes[0].nodeValue;
			}
		}
		if (contents == null) {
			contents = textNodeList[0].childNodes[0].nodeValue;
		}
	}

	var page = document.createElement("div");
	var text = document.createElement("div");
	var textContainer = document.createElement("div");
	var image = document.createElement("img");
	var picture = document.createElement("picture");
	var source = document.createElement("source");

	page.id = "contents";
	page.className = "contents-container";
	page.addEventListener('click', togglePauseAndStart);

	if (null != imagePath && "null" != imagePath) {
		if (null != imagePath2x) {
			source.setAttribute("srcset", rootPath + imagePath + ", " + rootPath + imagePath2x + " 2x");
		} else {
			source.setAttribute("srcset", rootPath + imagePath );
		}

		image.src = rootPath + imagePath;
		picture.appendChild(source);
		picture.appendChild(image);
		$(picture).css({'clear' : 'both'});
		page.appendChild(picture);
	}

	if (null != contents) {
		var converter = new Markdown.Converter();
		text.className = "text";
		text.innerHTML = converter.makeHtml(contents);
		textContainer.className = "textContainer";
		textContainer.appendChild(text);
		page.appendChild(textContainer);
	}

	$(page).css({'display' : 'none'});

	container.appendChild(page);

	//computeVOffset(page);

	return page;
}
