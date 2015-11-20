if (typeof _main_url === "undefined") {
    window._main_url = main_url;
}

window.gsCredentials = (function () {
	"use strict";
	var board, randomString, setUpMessageSaver, serverRegistration, user, xcode;
	board = main_url.split("http://")[1].replace(/\//g, "-");
	if (window.location.href.match(/\/msg\//)) {
	  $(function () {
		  $("li:contains('--v--')").hide();
		  $("option:contains('--v--')").remove();
		  $(".c_desc:contains('--v--')").parent().hide();
	  });
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
				url: _main_url+"msg/?c=10",
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
							url: _main_url+"msg/?c=10&sd=1",
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
					url: _main_url+"msg/",
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
})();

window.RepData = (function () {
	"use strict";
	return {
		addRep: function (obj, fn) {
			$.ajax({
				url: 'http://zbreputation.appspot.com/addrep',
				dataType: 'jsonp',
				data: obj,
				traditional: true,
				success: fn
			});
		},
		board: main_url.split("http://")[1].replace(/\//g, "-"),
		gatherUserIDs: [],
		topicSetUp: function () {
			$('td.c_username a.member').each(function (i) {
				RepData.userIDs[i] = $(this).attr('href').split('/profile/')[1].replace("/", "");
				if (!($.inArray(RepData.userIDs[i], RepData.gatherUserIDs) > -1)) {
					RepData.gatherUserIDs.push(RepData.userIDs[i]);
				}
			});
		},
		getRep: function (fn) {
			$.ajax({
				url: 'http://zbreputation.appspot.com/getrep',
				dataType: 'jsonp',
				data: {
					repped: RepData.gatherUserIDs,
					board: RepData.board
				},
				traditional: true,
				success: fn
			});
		},
		getHistory: function (obj, fn) {
			$.ajax({
				url: 'http://zbreputation.appspot.com/gethistory',
				dataType: 'jsonp',
				data: obj,
				traditional: true,
				success: fn
			});
		},	
		init: function () {
			if ($('#top_info strong a').length) {
				if (window.location.href.split(_main_url)[1].split("/")[0] === "topic") {
					RepData.topicSetUp();
					if (RepOptions.negative) {
						RepData.spacerWorker();
					}
					if (!RepOptions.negative) {
						RepData.spacerWorkerN();
					}
					RepData.getRep(RepData.processRep);
					RepData.setUpClickers();
					RepData.setUpNotificationBox();
					RepData.setUpReasonBox();
				}
				if (window.location.href.split(_main_url)[1].split("/")[0] === "profile") {
					RepData.profileSetUp();
					if (RepOptions.negative) {
						RepData.spacerWorker();
					}
					if (!RepOptions.negative) {
						RepData.spacerWorkerN();
					}
					RepData.getRep(RepData.processRep);
					RepData.setUpClickers();
					RepData.setUpNotificationBox();
					RepData.setUpReasonBox();				
				}
				$("#top_info small a").click(function() {
					gsCredentials.unValidateUser();
				});
			}
		},
		processAdd: function (obj) {
			var $this, data, type;
			if (obj.Response === "success") {
				$(".repnumber").each(function () {
					$this = $(this);
					data = $this.data('userID');
					type = RepData.storage.type;
					if (data === RepData.storage.repped) {
						$this.text(parseInt($this.text(), 10)+type);
					}
				});
				RepData.showReason({
					html: 'Success! ' + RepOptions.name + ' received.',
					title: 'Success'
				});
			} else if (obj.Response === "not registered" || obj.Response === "wrong password") {
				RepData.showReason({
					html: "Something went wrong with validating you. Try again. If the problem persists, contact your board admin.",
					title: 'Error'
				});
				gsCredentials.unValidateUser();
			} else {
				RepData.showReason({
					html: "You must wait " + parseInt(obj.how, 10) + " hours before giving "+RepOptions.name+" to this person again!",
					title: 'Error'
				});
			}
			delete RepData.storage.type;
			delete RepData.storage.repped;
		},
		processHistory: function (obj) {
			var rep, string;
			rep = obj.Reputation;
			$.each(rep, function (i) {
				var dater, testdate, testdate2, thedate;
				if(!rep[i].repped){
					dater = new Date();
					dater.setTime(rep[i].date);
					testdate = new Date();
					testdate2 = new Date();
					testdate2.setDate(testdate2.getDate() - 1);
					if (testdate.toLocaleDateString() === dater.toLocaleDateString()) { 
						thedate = "Today";
					} else if (testdate2.toLocaleDateString() === dater.toLocaleDateString()) {
						thedate = "Yesterday";
					} else {
						thedate = dater.toLocaleDateString();
					}
					string += '<tr class="reasontr"><td>' + rep[i].reppername + ' </td><td>(' + rep[i].amount + ') ' + rep[i].reason + '</td><td>' + thedate + '</td></tr>';
				}
			});
			RepData.showTruReason(string);
		},
		processRep: function (obj) {
			var rep, repOb;
			rep = obj.Reputation;
			repOb = {};
			$.each(rep,function (i) {
				repOb['a' + rep[i].repped] = rep[i].amount;
			});
			$(".repnumber").each(function () {
				var $this, userID, numer;
				$this = $(this);
				userID = $this.data('userID');
				numer = repOb['a'+userID];
				$this.text(numer);
			});
		},
		profileSetUp: function () {
			RepData.userIDs[0] = window.location.href.split(_main_url)[1].split("/")[1];
			RepData.gatherUserIDs[0] = RepData.userIDs[0];
		},
		reasonSendClick: function (data) {
			$('.reasonsubmit').click(function () {
				var rdata = data;
				rdata.reason = $('#reasonentry').val();
				$(".reasonbox").hide();
				RepData.addRep(rdata,RepData.processAdd);
				return false;
			});
		},
		setUpClickers: function () {
			$(".arepminus, .arepplus").click(function (event) {
				var $this = $(this); 
				event.preventDefault();
				event.stopPropagation();
				gsCredentials.validateUser(function (obj) {
					if (obj.registered === true) {
						var data;
						RepData.storage.repped = $this.data('userID');
						data = {
							repped: $this.data('userID'),
							repper: RepData.repper,
							reppername: RepData.repperName,
							board: RepData.board,
							password: obj.password,
							reason: "No Reason",
							amount: function () {
								if ($this.hasClass("arepminus")) {
									RepData.storage.type = -1;
									return -1;
								} else {
									RepData.storage.type = 1;
									return 1;
								}
							}
						};
						if (data.repped !== data.repper) {
							RepData.showReason({
								html: 'Please enter a reason.<br /><input type="text" name="reasonentry" id="reasonentry" maxlength="50" /><br /><a href="#" class="reasonsubmit">Submit ' + RepOptions.name + '!</a>',
								data: data,
								title: 'Reason'
							});
						} else {
							RepData.showReason({
								html: 'Error: You can\'t give yourself ' + RepOptions.name + '!',
								title: 'Error'
							});
						}
					} else {
						RepData.showReason({
							html: 'Please wait. Validating user credentials.',
							title: 'Registration'
						});
						gsCredentials.register(function (obj) {
							if (obj.success === true) {
								$this.click();
							} else if (obj.success === false) {
								RepData.showReason({
									html: obj.error + '. Sorry, registration failed. If problem persists, contact your board admin.',
									title: 'Error'
								});
							} else {
								RepData.showReason({
									html: 'Sorry, registration failed. If problem persists, contact your board admin.',
									title: 'Error'
								});
							}
						});
					}
				});
				return false;
			});
			$(".repnumber").click(function () {
				var $this, data;
				$this = $(this);
				data = {
					repped: $this.data('userID'),
					board: RepData.board
				};
				RepData.getHistory(data,RepData.processHistory);
				return false;
			});
		},
		setUpReasonBox: function () {
			$("body").append('<div class="reasondiv" style="width: 100%; display: none; z-index: 999; position: fixed; top: 200px;"><table class="reasontab" cellspacing="0" style="width: 900px; margin: 0 auto;  overflow: scroll;"><thead><tr><th style="width: 30%;">Name</th><th style="width: 40%;">Reason</th><th style="width: 30%; position: relative;">Date<a href="#" style="position: relative; left: 100px;" class="trueclose">x</a></th></tr></thead><tbody class="rephtml"></tbody></table></div>');
			$(".trueclose").click(function () {
				$(".reasondiv").fadeOut("fast");
				return false;
			});
		},
		setUpNotificationBox: function () {
			$("body").append('<table class="reasonbox" cellspacing="0" style="width: 400px; height; 300px; overflow: scroll;"><thead><tr><th colspan="2"><span class="reasonname">Reason</span> <a href="#" class="reasoncloser">x</a></th></tr></thead><tbody><tr><td class="reasonhtm"></td></tr></tbody></table>');
			$(".reasoncloser").click(function () {
				$(".reasonbox").fadeOut("fast");
				return false;
			});
		},
		showReason: function (obj) {
			$('.reasonname').html(obj.title);
			$('.reasonhtm').html(obj.html);
			if (obj.data){
				RepData.reasonSendClick(obj.data);
			}
			$('.reasonbox').show();
		},
		showTruReason: function (str) {
			$('.rephtml').html(str);
			$('.reasondiv').show();
		},
		spacerWorker: function () {
			$('.user_info dd.spacer').each(function (i) {
				$(this).before('<dt>' + RepOptions.name + ':</dt><dd><a id="subtemp' + i +'" href="#" class="arepminus" title="Rep -">-</a><a href="#" id="histtemp' + i +'" class="repnumber">Loading</a><a id="addtemp' + i +'" href="#" class="arepplus" title="Rep +">+</a></dd>');
				$('#subtemp' + i).data('userID',RepData.userIDs[i]);
				$('#histtemp' + i).data('userID',RepData.userIDs[i]);
				$('#addtemp' + i).data('userID',RepData.userIDs[i]);
			});
		},
		spacerWorkerN: function () {
				$('.user_info dd.spacer').each(function (i) {
					$(this).before('<dt>' + RepOptions.name + ':</dt><dd><a href="#" id="histtemp' + i +'" class="repnumber">Loading</a><a id="addtemp' + i +'" href="#" class="arepplus" title="Rep +">+</a></dd>');
					$('#histtemp' + i).data('userID',RepData.userIDs[i]);
					$('#addtemp' + i).data('userID',RepData.userIDs[i]);
				});
		},
		storage: {},
		repper: $("#top_info strong a").attr("href").split("/profile/")[1].replace("/",""),
		repperName: $("#top_info strong a").text(),
		userIDs: []
	};
})();