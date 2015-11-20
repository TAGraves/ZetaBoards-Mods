window.gsCredentials = (function () {
	"use strict";
	var board, randomString, setUpMessageSaver, serverRegistration, user, xcode;
	board = main_url.split("http://")[1].replace(/\//g, "-");
	if (window.location.href.split(main_url)[1].split("/")[0] === "msg") {
		$("li:contains('--v--')").hide();
		$("option:contains('--v--')").remove();
		$(".c_desc:contains('--v--')").parent().hide();
	}
	randomString = (function () {
		var chars, randomstring, rnum, i;
		chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		randomstring = "";
		for (i = 0; i < 10; i += 1) {
			rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		return randomstring;
	}());
	setUpMessageSaver = function (callback) {
			$.ajax({
				type: "GET",
				url: main_url+"msg/?c=10",
				dataType: "html",
				success: function (data) {
					xcode = $(data).find("input[name='xc']").val();
					serverRegistration(callback);
				}
			});
	};
	serverRegistration = function (callback) {
			$.ajax({
				url: 'http://zbreputation.appspot.com/register',
				dataType: 'jsonp',
				data: {
					user: user,
					board: board,
					password: randomString
				},
				traditional: true,
				success: function (response) {
					if (response.success) {
						$.zb.cookie.set(board+"gapi_pass",randomString,3650);
						$.ajax({
							type: "POST",
							url: main_url+"msg/?c=10&sd=1",
							data: {
								"xc": xcode,
								"new_folder": "--v--"+randomString+"--v--"	
							},
							success: function () {
								callback({
									success: true,
									password: randomString
								});
							}
						});
					} else {
						callback({
							success: false,
							error: response.error
						});
					}
				}
			});
	};
	user = $("#top_info strong a").attr("href").split("/profile/")[1].replace("/","");
	return {
		unValidateUser: function () {
			$.zb.cookie.set(board+"gapi_pass","",0);
		},
		validateUser: function (callback) {
			var cookie = $.zb.cookie.get(board+"gapi_pass");
			if (cookie !== "") {
				callback({
					registered: true,
					password: cookie
				});
			} else {
				$.ajax({
					type: "GET",
					url: main_url+"msg/",
					dataType: "html",
					success: function(data) {
						var password = $(data).find("#pm_folders").text().split("--v--")[1];
						if (password) {
							$.zb.cookie.set(board+"gapi_pass",password,3650);
							callback({
								registered: true,
								password: password
							});
						} else {
							callback({
								registered: false
							});
						}
					}
				});
			}
		},
		register: function (callback) {
			this.validateUser(function(obj){
				if (obj.registered === true) {
					callback({
						success: false,
						error: "This user has already registered!"
					});
				} else if (obj.registered === false) {
					setUpMessageSaver(callback);
				}
			});
		}
	};
}());