	swearReplacement.editSwears = function(obj){
		var escaper = function(str) {
     		return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
 		};
		$('td.c_post').each(function() {
			var $this = $(this);
			$.each(obj.swears, function(i) {
				var stringer = new RegExp(escaper(obj.swears[i]), "g")
				$this.html($this.html().replace(stringer,obj.swearReplacer));
			});
		});
	};
	swearReplacement.enabled = function(){
		var name = main_url+"swearstuff=";
		var cs = document.cookie.split(';');
		for(var i=0;i < cs.length;i++) {
			var c = cs[i]; 
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
		}
		return false;	
	};
	swearReplacement.init = function(obj){
		obj.updateCP(obj);
		obj.setUpA(obj);
		if (obj.enabled() == "enab") {
			obj.setUpB(obj);
			obj.editSwears(obj);
		}
	};
	swearReplacement.setUpA = function(obj){
		$("#swearHide").live("click",function(){
			obj.cookieWork("enab");
			$(this).text("Click here to show swear words").attr("id","swearShow");
			obj.setUpB(obj);
			return false;
		});
		
	};
	swearReplacement.setUpB = function(obj){
		$("#swearShow").live("click",function(){
			obj.cookieWork("disab");
			$(this).text("Click here to hide swear words").attr("id","swearHide");
			return false;
		});
	};
	swearReplacement.updateCP = function(obj){
		if (window.location.href.split(main_url)[1].split("/")[0] == "home" && window.location.href.split(main_url)[1].split("/")[1].split("#")[0] == "?c=4") {
			if (obj.enabled() == "enab") {
				$("#board_settings tbody").prepend('<tr><td class="c_desc">Show Swear Words</td><td><a href="#" id="swearShow">Click here to show swear words</a></td><tr>');
			} else {
				$("#board_settings tbody").prepend('<tr><td class="c_desc">Hide Swear Words</td><td><a href="#" id="swearHide">Click here to hide swear words</a></td><tr>');
			}
		}
	};
	swearReplacement.cookieWork = function(fn){
		document.cookie = main_url+"swearstuff="+fn+";expires=Thu, 2 Aug 2031 20:47:11 UTC; path=/";
	};