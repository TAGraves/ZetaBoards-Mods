var colorReplacement = {};
	colorReplacement.editPost = function(obj){
		var col = obj.enabled();
		var scache = $('textarea[name=post]');
		if (col!="" && scache.val() == "") scache.append("[color=#" + col +"][/color]");
		if (col!="" && window.location.href.split("multiquote_arr")[1] != undefined){
			var sval = scache.val();
			sval = sval.replace(/\[\/quote\]/g,"[\quote][color=#" + col +"][/color]");
			scache.val(sval);
		};
	};
	colorReplacement.enabled = function(){
		var name = main_url+"colorstuff=";
		var cs = document.cookie.split(';');
		for(var i=0;i < cs.length;i++) {
			var c = cs[i]; 
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
		}
		return "";	
	};
	colorReplacement.init = function(obj){
		obj.updateCP(obj);
		obj.setUpA(obj);
		obj.editPost(obj);
	};
	colorReplacement.setUpA = function(obj){
		$("#colorHide").live("click",function(){
			var val = $("#colorentry").val();
			if (val == "none") val = "";
			obj.cookieWork(val);
			$(".colorwords").prepend("Edited! ")
			return false;
		});
		
	};
	colorReplacement.updateCP = function(obj){
		if (window.location.href.split(main_url)[1].split("/")[0] == "home" && window.location.href.split(main_url)[1].split("/")[1].split("#")[0] == "?c=4") {
		var col = obj.enabled();
			if (col=="") col="none";
			
		$("#board_settings tbody").prepend('<tr><td class="c_desc">Default Post Color</td><td>#<input type="text" name="colorentry" id="colorentry" maxlength="6" value="'+col+'" /><a href="#" id="colorHide">Set </a><span style="padding-left: 15px;" class="colorwords">Enter a <a href="http://www.computerhope.com/htmcolor.htm">hex color code (without the # sign)</a>; other values won\'t work! Type "none" without the quotes for no default. </span></td><tr>');
		}
	};
	colorReplacement.cookieWork = function(fn){
		document.cookie = main_url+"colorstuff="+fn+";expires=Thu, 2 Aug 2031 20:47:11 UTC; path=/";
	};
	
	$(document).ready(function() {	
		colorReplacement.init(colorReplacement);
	});