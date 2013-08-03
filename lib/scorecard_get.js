/*
	This file is part of: jScorecard (c) 2013 J. Kaiden
	https://github.com/lljk/jscorecard
	licensed under a Creative Commons Attribution-NonCommercial 3.0 Unported License.
	http://creativecommons.org/licenses/by-nc/3.0/deed.en_US
*/


var game_url = null
var image_dir = 'images/';
var date = null;
var away_team = null, home_team = null;
var boxscore = null;
var away_innings = [], home_innings = [];
var away_batters = [], home_batters = [];
var away_pitchers = [], home_pitchers = [];
var away_actions = {}, home_actions = {};
//var failed = [];

function get_json(url, callback) {
	jsonlib.fetch(url, function(data) {
			content = data.content;
			if (window.DOMParser) {
				var parser = new DOMParser();
				var xml = parser.parseFromString(content,"text/xml");
				var json = $.xml2json(xml);
				callback(json);
			};
	});
};

function get_games(){
	var d = $.datepicker.formatDate("yy-mm-dd", $('#datepicker').datepicker('getDate')).split('-');
	game_url = 'http://gd2.mlb.com/components/game/mlb/'+ 'year_' + d[0] + '/month_' + d[1] + '/day_' + d[2] + '/';
	var url = game_url + 'epg.xml';
	
	var months = [0, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var year = d[0], month = months[parseInt(d[1])], day = d[2];
	date = month + '&nbsp' + day + ',&nbsp' + year;
	
	get_json(url, function(json) {
			if (local_save) { localStorage.setItem('epg', JSON.stringify(json)) };
			var games = json.game;
			make_games_list(games, function(game, id){
					game_url += 'gid_' + id + '/';
					make_confirm_box(game, date);
			});
	});
};
  
function get_game_header(game_url, callback) {
	var url = game_url + 'game.xml';
	var header = []
	
	get_json(url, function(json) {
			var teams = json.team, date = null;
			var park = json.stadium.name + ', ' + json.stadium.location;
			
			$(teams).each(function(i, team) {
					if (team.type == 'home') {home_team = team};
					if (team.type == 'away') {away_team = team};
			});
			get_team_images(function(){signal_got()});
			get_boxscore(function(){signal_got()});
			
			function get_team_images(callback) {
				var url = game_url + 'atv_preview.xml'
				get_json(url, function(json) {
						var away_image = json.body.preview.baseballLineScorePreview.banners.headToHeadBanner.leftImage
						var home_image = json.body.preview.baseballLineScorePreview.banners.headToHeadBanner.rightImage
						$(away_team).attr('image_url', away_image);
						$(home_team).attr('image_url', home_image);
						callback()
				});
			};
			
			function get_boxscore(callback) {
				var url = game_url + 'boxscore.xml'
				get_json(url, function(json) {
						boxscore = json;
						if (local_save) {
							localStorage.setItem('boxscore', JSON.stringify(boxscore));
						};
						callback();
				});
			};
			
			var gotten = 0
			function signal_got() {
				gotten += 1
				if (gotten == 2) {
					if (local_save) {
						localStorage.setItem('home_team', JSON.stringify(home_team));
						localStorage.setItem('away_team', JSON.stringify(away_team));
						localStorage.setItem('date', date);
						localStorage.setItem('park', park);
					};
					callback(away_team, home_team, boxscore, park);
				};
			};
	});
};



function get_innings(game_url, callback) {
	var url = game_url + 'inning/inning_all.xml'
	get_json(url, function(json) {
			this.innings = json.inning
			$(this.innings).each(function(i, inning) {
					away_innings.push(inning.top.atbat);
					if (inning.bottom) {
						home_innings.push(inning.bottom.atbat)
					};
					signal_got('got one!')
			});
	});
	var gotten = [];
	function signal_got(got) {
		gotten.push(got);
		if (gotten.length == this.innings.length) {
			callback(away_innings, home_innings);
		};
	};
	
	function get_inning_actions(home_or_away) {
		if (home_or_away == 'away') {var innings = away_innings, actions = away_actions};
		if (home_or_away == 'home') {var innings = home_innings, actions = home_actions};
		var ab_starts = [];
		$(innings).each(function(i, inning){
				$(inning).each(function(ab_i, atbat){
						ab_starts.push(atbat.start_tfs)
				});
		});
		var action_ab = null;
		$.each(actions, function(key, val){
				$(ab_starts).each(function(i, tfs){
						if (key <= tfs) {
							ab_starts.splice(i, 0, val)
						};
				});
		});
	};
};


function get_players(game_url, away_innings, home_innings, callback) {
	var away_bat_ids = [], home_bat_ids = [];
	var away_pitch_ids = [], home_pitch_ids = [];
	build_id_arrays(away_innings, away_bat_ids, away_pitchers);
	build_id_arrays(home_innings, home_bat_ids, home_pitchers);
	
	function build_id_arrays(innings, bat_ids_array, pitch_array) {
		$(innings).each(function(i, atbats) {
				$(atbats).each(function(i, atbat) {
						if ($.inArray(atbat.batter, bat_ids_array) == -1) {bat_ids_array.splice(parseInt(atbat.num) - 1, 0, atbat.batter)};
						if ($.inArray(atbat.pitcher, pitch_array) == -1) {pitch_array.push(atbat.pitcher)};
				});
		});
		bat_ids_array = bat_ids_array.filter(function(n){return n});
	};
	
	var fetched = 0, to_fetch = home_bat_ids.length + away_bat_ids.length, signaled = 0, failed = [];
	$('body').prepend('<div id="progress_area"></div>');
	$('#progress_area').progressbar({value: 0, max: to_fetch});
	
	
	fetch_batters(game_url, away_bat_ids, function(batter) {
			build_batters_array(batter, away_batters, away_bat_ids, function() {get_pitchers()}); 
	});
	fetch_batters(game_url, home_bat_ids, function(batter) {
			build_batters_array(batter, home_batters, home_bat_ids, function() {get_pitchers()}); 
	});
	
	function fetch_batters(game_url, id_array, callback_fetch) {
		attempt_fetch();///////////////////////////////
		function attempt_fetch() {///////////////////////////////////
			$(id_array).each(function(i, id) {
					var url = game_url + 'batters/' + id + '.xml';
					get_json(url, function(json) {
							if (json.body && json.body.parsererror){
								console.log('PARSER error fetching batter id ' + id);////////////////
								//failed.push(b_id);
								//console.log(failed);////////////////////
							}
							else {
								fetched += 1
								$('#progress_area').progressbar({value: fetched});
								callback_fetch(json);
							};
					});
			});
		}; // attempt_fetch()
	}; // fetch_batters()
	
	function build_batters_array(batter, batters_array, ids_array, batters_array_callback) {	  
		batters_array.splice(ids_array.indexOf(batter.id), 0, batter);
		if (away_batters.length == away_bat_ids.length && home_batters.length == home_bat_ids.length) {
			batters_array_callback('got batters');
		};
	};

	function get_pitchers() {
		fetched = 0; to_fetch = away_pitchers.length + home_pitchers.length;
		$('#progress_area').progressbar({value: 0, max: to_fetch});
		build_pitchers_array('away'); build_pitchers_array('home');
		fetch_pitchers(away_pitchers, function(){call_it_all_back()});
		fetch_pitchers(home_pitchers, function(){call_it_all_back()});
	};
	
	function fetch_pitchers(pitchers, fetch_pitchers_callback) {
		attempt_fetch();///////////////////////////////
		function attempt_fetch() {///////////////////////////////////
			$(pitchers).each(function(i, pitcher) {
					var url = game_url + 'pitchers/' + pitcher.id + '.xml';
					get_json(url, function(json) {
							if (json.body && json.body.parsererror){
								console.log('PARSER error fetching batter id ' + id);////////////////
								//failed.push(b_id);
								//console.log(failed);////////////////////
							}
							else {
								fetched += 1
								$('#progress_area').progressbar({value: fetched});
								$(pitcher).attr('career', json.career);
								$(pitcher).attr('season', json.season);
								if (fetched == to_fetch) {fetch_pitchers_callback('got pitchers')};
							};
					});
			});
		}; // attempt_fetch()
	}; // fetch_pitchers()
	
	function build_pitchers_array(home_or_away) {
		$(boxscore.pitching).each(function(i, team) {
			if (team.team_flag == 'away') { away_pitchers = team.pitcher };
			if (team.team_flag == 'home') { home_pitchers = team.pitcher };
		});
		if (home_or_away == 'away') {var innings = away_innings, pitchers = away_pitchers};
		if (home_or_away == 'home'){var innings = home_innings, pitchers = home_pitchers};
		var total_atbats = 0
		$(innings).each(function(in_i, inning){
			total_atbats += inning.length
		});
		$(pitchers).each(function(i, pitcher) {
			var ipr = innings.length * (parseInt(pitcher.bf) / total_atbats);
			var rem = (ipr % 1).toFixed(2);
			var tern = parseFloat((rem * 0.33).toFixed(1));
			if (tern == 0.3) { tern = 1 };
			var ip = Math.floor(ipr) + tern;
			$(pitcher).attr('ip', ip);
		});
	};
	
	function call_it_all_back() {
		if (local_save) {
			localStorage.setItem('away_batters', JSON.stringify(away_batters));
			localStorage.setItem('home_batters', JSON.stringify(home_batters));
			localStorage.setItem('away_pitchers', JSON.stringify(away_pitchers));
			localStorage.setItem('home_pitchers', JSON.stringify(home_pitchers));
		}
		callback(away_batters, home_batters, away_pitchers, home_pitchers);
	};
}; // get_players()

function get_batter_innings(home_or_away) {
	if (home_or_away == 'away') {var innings = away_innings, batters = away_batters, actions = away_actions};
	if (home_or_away == 'home'){var innings = home_innings, batters = home_batters, actions = home_actions};
	
	$(batters).each(function(b_i, batter){
			var batter_innings = {};

			$(innings).each(function(in_i, inning) {
					var inn_actions = $(actions).attr(in_i), action_times = [];
					if (inn_actions) {
						if (inn_actions.length) {
							$(inn_actions).each(function(i, tfs){
									action_times.push(tfs);
							});
						}
						else {
							action_times.push(inn_actions.tfs);
						};
					};
					$(inning).each(function(ab_i, atbat){
							if (atbat.batter == batter.id) {
								if (batter_innings[in_i + 1]) {
									batter_innings[in_i + 1].push(atbat);
								}
								else {
									batter_innings[in_i + 1] = [atbat];
								};
							};
					});
			});
			$(batter).attr('innings', batter_innings);
	});
};

function get_batter_stats(batter, callback) {
	var career_stats = '', season_stats = '';
	$.each(batter.career, function(key, value) {
			career_stats += key + ':' + value + '  ';
	});
	$.each(batter.season, function(key, value) {
			season_stats += key + ':' + value + '  ';
	}); 
	callback([batter.season, batter.career]);		  
};

function get_pitcher_by_id(pitchers, id, callback) {
	$(pitchers).each(function(i, pitcher){
			if (pitcher.id == id) {
				callback(pitcher.name_display_first_last);
				return(false);
			};
	});
};

function get_fielding(d, callback) {
	var des = d.toString();
	var fldg = [], fielding = [];
	if (des.match('pitcher')) { fldg.splice(des.indexOf('pitcher'), 0, '1') };
	if (des.match('catcher')) { fldg.splice(des.indexOf('catcher'), 0, '2') };
	if (des.match('first baseman')) { fldg.splice(des.indexOf('first baseman'), 0, '3') };
	if (des.match('second baseman')) { fldg.splice(des.indexOf('second baseman'), 0, '4') };
	if (des.match('third baseman')) { fldg.splice(des.indexOf('third baseman'), 0, '5') };
	if (des.match('shortstop')) { fldg.splice(des.indexOf('shortstop'), 0, '6') };
	if (des.match('left field')) { fldg.splice(des.indexOf('left field'), 0, '7') };
	if (des.match('center field')) { fldg.splice(des.indexOf('center field'), 0, '8') };
	if (des.match('right field')) { fldg.splice(des.indexOf('right field'), 0, '9') };
	for (var index in fldg) {
		if (fldg[index]) { fielding.push(fldg[index]) };
	};
	callback(fielding.join('-'));
	};

function get_outs(atbat, index, atbats, callback) {
	if (index > 0) { var last_atbat = atbats[index - 1]; }
	else { var last_atbat = '0' }
	if (atbat.o != 0 && atbat.o != last_atbat.o) {
		callback(atbat.o);
	};
};

function get_rbi(atbat_des, callback) {
	var rbi = atbat_des.match(/scores/g);
	if (!rbi) {rbi = []};
	callback(rbi.length);
};

function get_bases(atbat, index, atbats, callback) {
	var bases = [];
	/*
	if (atbat.pitch) {
		var pitch = null
		if (atbat.pitch.length) { pitch = atbat.pitch[atbat.pitch.length -1]; }
		else { pitch = atbat.pitch };
		if (pitch.on_1b){ bases.push(1); };
		if (pitch.on_2b){ bases.push(2); };
		if (pitch.on_3b){ bases.push(3); };
	}
	*/
	if (atbat.runner) {
		if (atbat.runner.length){
			$(atbat.runner).each(function(i, runner){
					if (runner.end[0]) {bases.push(runner.end[0])}
			});
		}
		else {
			if (atbat.runner.end[0]) {bases.push(atbat.runner.end[0])}
		};
	};
	
	if (bases.length > 0) {
		callback(bases);
	};
};

function get_atbat_des(atbat) {
	var runner_events = [], desc = atbat.des;
	if (atbat.runner) {
		if (atbat.runner.length){
			$(atbat.runner).each(function(i, runner){
					runner_events.push(runner.event);
			});
		}
		else{
			runner_events.push(atbat.runner.event);
		};
	};
	if (runner_events.length) {
		$(runner_events).each(function(i, r_event){
				if (r_event != atbat.event) {desc += ('<br><br>' + r_event)}
		});
		$(atbat).attr('des', desc)
	};
};

function get_event(atbat, callback) {
	var note = '', hit = null, event = atbat.event, desc = atbat.des;
	switch(event) {
	case 'Single': note = '1B'; hit = 'single'; break;
	case 'Double': note = '2B'; hit = 'double'; break;
	case 'Triple': note = '3B'; hit = 'triple'; break;
	case 'Home Run': note = 'HR'; hit='home_run'; break;
	case 'Walk': note = 'BB'; break;
	case 'Intent Walk': note = 'IBB'; break;
	case 'Hit By Pitch': note = 'HBP'; break;
	case 'Strikeout':
		if(desc.match('called')) { note = 'Kc'; }
		else { note = 'K';}; break;
	case 'Flyout': note = 'F'; break;
	case 'Groundout': note = 'G'; break;
	case 'Pop Out': note = 'P'; break;
	case 'Lineout': note = 'L'; break;
	case 'Forceout': note = 'FO'; break;
	}
	if (event.match('DP') || desc.match('double play')) { note = 'DP'; }
	else if (event.match('TP') || desc.match('triple play')) { note = 'TP'; }
	if (desc.match("fielder's choice")) { note = 'FC'; }
	else if (desc.match('ground-rule')) { note = 'GR'; };
	if (desc.match('sacrifice')) { note = 'SAC'; };
	if (event.match('Interference')) { note = 'INT' };
	
	callback(note, hit);
};

//////////////////EOF/////////////////////
