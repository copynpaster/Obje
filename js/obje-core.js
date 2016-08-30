/* main js must rename and refactoring*/
var pageList;
var currentPage;
var pagesContainer;

var defaultFadeInDuration = 3000;
var defaultFadeOutDuration = 3000;
var defaultDuratuin = 9000;
var isProgess = false;
var languageCode;
var defaultBackground;
var rootPath;

$(document).ready(initializeUi);

var inputTimer;
var lastX, lastY, lastStamp;

function resetTimeout(e) {
	setVisibilityController(true);
	
	clearTimeout(inputTimer);
	inputTimer = setTimeout(hideController, 1500);
}

function hideController() {
	setVisibilityController(false);
}

function checkShortcut(e) {
	switch(e.which) {
		// space bar
		case 32 : togglePauseAndStart(); break;
		 // left key
		case 37 : movePrevPage(); break;
		 // right key
		case 39 : moveNextPage(); break;
	}
}

function initializeUi() {
	// language setting
	languageCode = $.urlParam('lang');

	var userLang = navigator.language || navigator.userLanguage;
	if (languageCode == null && userLang != null) {
		languageCode = userLang.split('-')[0];
	}

	document.onselectstart = function() { return false; };
	document.ondragstart = function() { return false; };
	
	pagesContainer = document.getElementsByTagName('pages')[0];

	lastStamp = lastX = lastY = -1;
	$(this).mousemove(function(e) {
		if (lastX < 0 || lastY < 0 || lastStamp < 0) {
			lastX = currX;
			lastY = currY;
			lastStamp = e.timeStamp;
			return;
		}

		if ( (e.timeStamp - lastStamp) < 50) return;

		var currX = e.clientX;
		var currY = e.clientY;
		
		var dx = Math.abs(currX - lastX);
		var dy = Math.abs(currY - lastY);
			
		if (dx > 3 || dy > 3) {
			resetTimeout(e);
		}

		lastX = currX;
		lastY = currY;
		lastStamp = e.timeStamp;
	});
	$(this).mousedown(resetTimeout);
    $(this).keypress(resetTimeout);
    $(document).bind('touchend', resetTimeout);

    $(this).keyup(checkShortcut);
	
	var portfolio = $.urlParam("p");

	if (portfolio != null) {
		rootPath = "assets/" + portfolio + "/"
		loadXmlData(rootPath + "obje.xml", onLoadData);
	} else {
		alert("Portfolio name is empty");
	}

	$( window ).resize(function() {
		computeVOffset( $( '#contents' ) );
	});

	if ($(document).fullScreen() != null) {
		$( '#fullscreen' ).toggle(true);
		chagneFullScreenText();

		$(document).bind("fullscreenchange", function() {
			chagneFullScreenText();
		});
	} else {
		$( '#fullscreen' ).toggle(false);
	}
	
	inputTimer = setTimeout(hideController, 1500);
}

function chagneFullScreenText() {
	if ( $(document).fullScreen() ) {
		$('#fullscreen').hide();
		$('#defaultscreen').show();
	} else {
		$('#fullscreen').show();
		$('#defaultscreen').hide();
	}
	
}

function setLanguage(languageCode) {
	this.languageCode = languageCode;

	var slideInfo = pageList[currentPage];
	var autonext = slideInfo.getAttribute("autonext");

	movePage(currentPage, autonext);
}

function runProgressBySlideInfo(slideInfo) {
	var autonext = slideInfo.getAttribute("autonext");
	var duration = slideInfo.getAttribute("duration");

	if (autonext != 'false') {
		if (null == duration) {
			duration = defaultDuratuin;	
		} else {
			duration *= 1;
		}
		runProgress(duration);
	} else {
		pause();
	}
}

function runProgress(time) {
	console.log("runProgress : " + time);

	$( '#slider').fadeOut('fast'); 
	$( '#progressbar').fadeIn('fast');

    var progressBar = $( "#progressbar" ).find("div");

    progressBar.animate({ width: $( "#progressbar" ).width() }, 10, 'linear');
    progressBar.animate({ width: 0 }, time, 'linear', function() {
    	showNextPage();
    });

    isProgess = true;
}

function onLoadData(xmlData) {
	setStyle(xmlData);

	var languages = xmlData.getElementsByTagName("languages");
	var langSet = languages[0].getElementsByTagName("language");
	// TODO 코드 정리
	var supportedLang = false;
	var languageSet = $("#language-list");
	if (null != langSet && 0 < langSet.length) {
		for (var idx = 0; idx < langSet.length; idx++) {
			var lang = langSet[idx];
			languageSet.append("<a href=\"javascript:;\" onClick=\"javascript:setLanguage('"
					+ lang.getAttribute('value') + "')\" class=\"list-group-item\" data-dismiss=\"modal\">"
					+ lang.getAttribute('name') + "</a>");

			if (!supportedLang) {
				supportedLang = (languageCode == lang.getAttribute('value'));
			}
		}
	} else {
		$("#language").hide();
		supportedLang = true;
	}

	if (!supportedLang) {
		languageCode = langSet[0].getAttribute('value');
		$("#langModal").modal('show');
	}

	pageList = xmlData.getElementsByTagName("page");
	currentPage = 0;
	
	if (null == pageList || 0 == pageList.length) {
		alert("Data empty");
	} else {
		var pageInfo = xmlData.getElementsByTagName("pages");
		defaultBackground = pageInfo[0].getAttribute("background");
		var duration = pageInfo[0].getAttribute("duration");
		var transition = pageInfo[0].getAttribute("transition");
		
		if (null != defaultBackground) {
			$('body').css('background', defaultBackground);
		}

		if (null != duration && duration > 0) {
			defaultDuratuin = duration * 1;
		}

		if (null != transition && transition > 0) {
			defaultFadeOutDuration = defaultFadeInDuration = transition * 1;
		}

		preloadImage(currentPage);

		$('#slider-bubble').hide();
		setSliderBubble(0);

		$( "#slider" ).slider({
			handler: '#slider-handle',
			value: 0,
			min: 0,
			max: pageList.length - 1,
			step: 1,
			start: function(event, ui) {
				$('#slider-bubble').fadeIn('fast');
			},
			slide: function(event, ui) {
				setSliderBubble(ui.value);
			},
			stop: function(event, ui) {
				$('#slider-bubble').fadeOut('fast');
				console.log("slider.stop : " + ui.value);

				currentPage = ui.value;
				movePage(currentPage, false);
			},
			change: function(evnet, ui) {
				// void
			}
		});
	}
}

function setStyle(xmlData) {
	// progressbar setting.
	var settings = xmlData.getElementsByTagName("settings")[0];

	if(settings == null) {
		console.log("settings is empty");
		return;
	}
	var style = document.createElement("style");

	// progress color
	var progressbar = settings.getElementsByTagName("progressbar");
	if (progressbar && progressbar.length > 0) {
		var color = progressbar[0].getAttribute("color");
		if (color) {
			style.appendChild(document.createTextNode("#progressbar div {background: " +  color + ";}"));
		}
	}

	// text button color
	var button = settings.getElementsByTagName("button");
	if (button && button.length > 0) {
		var color = button[0].getAttribute("color");
		if (color) {
			style.appendChild(document.createTextNode("div.interface_btn {color: " +  color + ";}"));
		}

		$(button).children().each(function(index, element) {
			var childColor = element.getAttribute("color");
			style.appendChild( document.createTextNode("div." + element.tagName + " {color: " +  childColor + ";}") );
		});
	}

	// text setting.
	var text = settings.getElementsByTagName("text");
	if (text && text.length > 0) {
		var color = text[0].getAttribute("color");
		if (color) {
			style.appendChild(document.createTextNode("pages .text {color: " +  color + ";}"));
		}

		$(text).children().each(function(index, element) {
			var childColor = element.getAttribute("color");
			style.appendChild( document.createTextNode("pages .text " + element.tagName + " {color: " +  childColor + ";}") );
		});
	}

	document.head.appendChild(style);
}

function setSliderBubble(value) {
	var maxval = $('#slider').slider("option", "max");
	var percent = (value / maxval) * 100;
	$('#slider-bubble').css('left', percent + '%').text(value + 1);
}

function setVisibilityController(isVisible) {
	if (isVisible) {
		if ($(navi_prev).css("opacity") < 1.0) {
			$(navi_prev).fadeTo(100, 1.0);
		}
		
		if ($(navi_next).css("opacity") < 1.0) {
			$( navi_next ).fadeTo(100, 1.0);
		}

		if ($('#progressbar').is(':hidden') && $(slider).css("opacity") < 1.0) {
			$(slider).fadeTo(100, 1.0);
		}
	} else {
		if ($(navi_prev).css("opacity") > 0.0) {
			$( navi_prev ).fadeTo(1000, 0.0);
		}
		
		if ($(navi_next).css("opacity") > 0.0) {
			$( navi_next ).fadeTo(1000, 0.0);
		}

		if ($('#progressbar').is(':hidden') && $(slider).css("opacity") > 0.0) {
			$(slider).fadeTo(1000, 0.0);
		}
	}
}

function preloadImage(index) {
	var image = new Image();
	image.onLoad = imagesLoad();
	
	var preloadLimit = index + 3;
	if (preloadLimit > pageList.length) preloadLimit = pageList.length;
	
	for(var idx = index; idx < preloadLimit; idx++) {
		var page = pageList[idx];
		var imageInfo = page.getElementsByTagName("image")[0];
		var imageInfo2x = page.getElementsByTagName("image2x")[0];
		
		if (null != imageInfo2x && window.devicePixelRatio == 2.0) {
			var imagePath = imageInfo2x.childNodes[0].nodeValue;
			if ("null" != imagePath) {
				image.src = imagePath;
			}
		} else if (null != imageInfo) {
			var imagePath = imageInfo.childNodes[0].nodeValue;
			if ("null" != imagePath) {
				image.src = imagePath;
			}
		}
	}
}

var isFirstLoad = true;

function imagesLoad() {
	if (isFirstLoad) {
		currentPage = -1;
		isFirstLoad = false;
		showNextPage();
	}
}

var oldPage;
function showNextPage() {
	var nextPage = currentPage + 1;
	//console.log("nextPage : " + nextPage + " / " + pageList.length);
	if (nextPage < pageList.length) {
		$("html, body").animate({ scrollTop: 0 }, 100);
		
		var slideInfo = pageList[nextPage];
		var background = slideInfo.getAttribute("background");
		// var autonext = slideInfo.getAttribute("autonext");
		// var duration = slideInfo.getAttribute("duration");
		var newPage = addPageContents(pagesContainer, slideInfo, languageCode);
		startCrossFade(oldPage, newPage, defaultFadeInDuration, defaultFadeOutDuration);
		oldPage = newPage;

		if (background != null) {
			$('body').animate({'backgroundColor': background}, defaultFadeInDuration );
		} else if (defaultBackground != null) {
			$('body').animate({'backgroundColor': defaultBackground}, defaultFadeInDuration );
		}
		
		currentPage++;
		moveSlider(currentPage);
		
		preloadImage(currentPage);

		if (nextPage < pageList.length - 1) {
			runProgressBySlideInfo(slideInfo);
		}
	} else {
		//console.log("slide show is finished");
	}
}

function moveNextPage() {
	if (currentPage < pageList.length - 1) movePage(++currentPage, true);
}

function movePrevPage() {
	if (0 < currentPage) movePage(--currentPage, true);
}

function movePage(pageIndex, rewind) {
	if (0 <= pageIndex && pageIndex < pageList.length) {
		$("html, body").animate({ scrollTop: 0 }, 100);
		var progressBar = $( "#progressbar" ).find("div");

		$(progressBar).stop(true, false);

		if (pageIndex < pageList.length - 1) {
			$(progressBar).animate({ width: $( "#progressbar" ).width() }, 100, 'linear');
		} else {
			$(progressBar).animate({ width: 0 }, 10, 'linear');
		}
		
		
		var slideInfo = pageList[pageIndex];
		var background = slideInfo.getAttribute("background");
		var newPage = addPageContents(pagesContainer, slideInfo, languageCode);
		
		startCrossFade(oldPage, newPage, 100, 100);
		oldPage = newPage;

		if (background != null) {
			$('body').animate({'backgroundColor': background}, 100 );
		} else if (defaultBackground != null) {	
			$('body').animate({'backgroundColor': defaultBackground}, 100 );
		}

		moveSlider(pageIndex);

		preloadImage(pageIndex);

		if(rewind) {
			if (pageIndex < pageList.length - 1) {
				runProgressBySlideInfo(slideInfo);
			}
		}
	} else {
		console.log("pageIndex outbound");
	}
}

function moveSlider(index) {
	$( "#slider" ).slider({ value: index });
}

function startCrossFade(oldPage, newPage, fadeinDuration, fadeoutDuration) {
	if (null != oldPage) $(oldPage).fadeTo(fadeinDuration, 0.0, function() { $(oldPage).remove(); });
	if (null != newPage) $(newPage).fadeTo(fadeoutDuration, 1.0);
}

function togglePauseAndStart() {
	console.log("togglePauseAndStart");

	if ( isProgess ) {
		pause();
	} else {
		var slideInfo = pageList[currentPage];
		var autonext = slideInfo.getAttribute("autonext");

		if (autonext == 'false') {
			showNextPage();
		} else {
			runProgress(3000);
		}
	}
}

function pause() {
	var progressBar = $( "#progressbar" ).find("div");

	$(progressBar).stop(true, false);
	$(progressBar).animate({ width: $( "#progressbar" ).width() }, 100, 'linear');

	$( '#slider').fadeIn('fast');
	$( '#progressbar').fadeOut('fast');

	isProgess = false;
}
