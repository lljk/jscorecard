 /*
	This file is part of: jScorecard (c) 2013 J. Kaiden
	https://github.com/lljk/jscorecard
	licensed under a Creative Commons Attribution-NonCommercial 3.0 Unported License.
	http://creativecommons.org/licenses/by-nc/3.0/deed.en_US
*/
 
function make_input_form(){
	$('body').append('<form id="input_form" action=""></form>');
	$('#input_form').append('<h1><big>jScorecard</big></h1>');
	$('#input_form').append('<h1><big>Baseball Scorecard Generator</big></h1>');
	$('#input_form').append('<div id="datepicker"></div><br>');
	$('#datepicker').datepicker({inline: true, dateFormat: 'D, M d, yy'});
	$('#input_form').append('<button id="search_btn"><big>Search for 	Games</big></button><br><br>');
	
	$('#search_btn').click(function() { get_games(); return false });
	$('#datepicker').change(function(){
			if ($('#games_list')) { $('#games_list').remove() };
	});
	
};

function make_games_list(games, callback) {
	if ($('#games_list')) { $('#games_list').remove() };
	$('body').append('<div id="games_list"></div>');
	$(games).each(function(i, game) {
			var entry = game.away_team_city + ' @ ' + game.home_team_city + '  ' + game.home_time + ' ' + game.home_ampm + ' ' + game.home_time_zone
			$('#games_list').append('<p class="game_listing" id="game_listing_' + game.gameday + '"><big>' + entry + '</big></p>');
			
			$('#game_listing_' + game.gameday).click(function(){
					callback(entry, game.gameday);
			});
	});	  
};

function make_confirm_box(game, date) {
	if ($('.game_listing')) {$('.game_listing').remove()};
	$('#select_date').hide();
	$('#input_form').append('<div id="confirm_box"></div>');
	$('#confirm_box').append('<h2 id="confirm_msg"><big>Make Cards for<br>' + game + '<br>' + date +  '</big></h2>');
	$('#confirm_box').append('<div id="confirm_buttons"><button class="confirm_button" id="make_btn"><big>Make</big></button><button class="confirm_button" id="cancel_btn"><big>Cancel</big></button></div>');
	$('#cancel_btn').click(function() {
			$('#confirm_box').remove();
			$('#select_date').show();
	});
	$('#make_btn').click(function() {
			$('#input_form').remove();
			make_card('away');
	});
};

function make_card(home_or_away) {
	var url = game_url;
	get_game_header(url, function(away_team, home_team, boxscore, park) {
			make_header(home_or_away, away_team, home_team, boxscore, park);
	});
	get_innings(url, function(away, home) {
			if (local_save) {
				localStorage.setItem('away_innings', JSON.stringify(away));
				localStorage.setItem('home_innings', JSON.stringify(home));
			}
			get_players(url, away, home, function(away_batters, home_batters, away_pitchers, home_pitchers){
					if ($('#progress_area')){$('#progress_area').remove()};
					make_batting_table(home_or_away);
					make_pitching_table(home_or_away);
			});
	});

};

function make_header(home_or_away, away_team, home_team, boxscore, park) {
	if (home_or_away == 'away') {var team = away_team, opponent = home_team, new_card = 'home'};
	if (home_or_away == 'home') {var team = home_team, opponent = away_team, new_card = 'away'};
	
	$('body').append('<div id="header"><div id="header_box">');
	$('#header').prepend('<p id="date_line">' + date + ' - ' + park + '</p>');
	$('#header_box').append('<table id="linescore"></table></div></div>');
	
	$('#linescore').append('<tr><td><h1>' + away_team.name_full + '</h1></td><td class="linescore_box"><h2>' + boxscore.linescore.away_team_runs + '</h2></td><td class="linescore_box">' +  boxscore.linescore.away_team_hits + '</td><td class="linescore_box">' + boxscore.linescore.away_team_errors + '</td></tr>');
	
	$('#linescore').append('<tr><td><h1>' + home_team.name_full + '</h1></td><td class="linescore_box"><h2>' + boxscore.linescore.home_team_runs + '</h2></td><td class="linescore_box">' +  boxscore.linescore.home_team_hits + '</td><td class="linescore_box">' + boxscore.linescore.home_team_errors + '</td></tr>');

	var img_url = team.image_url;
	var op_img_url = opponent.image_url;
	
	$('#header').append('<button type="submit" id="card_switch" title="Show ' + opponent.name_brief + ' Card"><img id="card_switch_image" src="' + op_img_url + '"></button>');

	$('#header').append('<img class="team_image" src="' + img_url + '">');
	
	$('#card_switch').click(function(){
			$('body').empty();
			make_header(new_card, away_team, home_team, boxscore, date, park);
			make_batting_table(new_card);
			make_pitching_table(new_card);
	});
	
	$('body').append('<div id="batter_dialog"></div>');
	$('body').append('<div id="atbat_dialog"></div>');
	$('body').append('<div id="pitcher_dialog"></div>');
	$('body').append('<div id="help_dialog"></div>');
};

function make_batting_table(home_or_away) {
	if (home_or_away == 'away'){ var batters = away_batters, innings = away_innings, pitchers = home_pitchers };
	if (home_or_away == 'home'){ var batters = home_batters, innings = home_innings, pitchers = away_pitchers };
	
	var batting_table = $('<div class="batting_table"></div>)');
	var inn_row = $('<div class="row" id="inn_row"></div><br>)');
	inn_row.append('<div class=player_box id="player_dummy"></div>');
	batting_table.append(inn_row);
	$('body').append(batting_table);
	
	for (var i = 1; i <= away_innings.length; i++) {
			inn_row.append('<div class="cell" id="inning_cell"><p>' + i + '</p></div>');
	};
	
	get_batter_innings(home_or_away);
	
	$(batters).each(function(i, batter){
			var row = $('<div class="row" id="' + batter.id + '"></div>');
			batting_table.append(row);
			get_batter_stats(batter, function(stats){
					row.append('<div id="player_box_' + batter.id + '" class="player_box">' + batter.last_name + '<br>' + '#' + batter.jersey_number + '&nbsp&nbsp' + batter.current_position +'</div>');
					
					$('#player_box_' + batter.id).click(function(event){
							make_batter_popup(stats[0], stats[1], function(table){
									make_popup(batter.first_name + '&nbsp' + batter.last_name, table, event);
							});
					});
			});
			
			for (var inn = 1; inn <= away_innings.length; inn++) {	
				var cell = $('<div class="cell" ></div>');
				cell.append('<div class="spacer"></div><div class="diamond"></div>');
				$('#' + batter.id).append(cell);
				
				var multi_atbat = false, pitcher = null, description = '';
				$.each(batter.innings, function(b_inn, atbats){
						if (b_inn == inn) {
							if (atbats.length == 1) {
								get_atbat_des(atbats[0]);
								get_pitcher_by_id(pitchers, atbats[0].pitcher, function(p){
										pitcher = p
								});
								description = atbats[0].des + '<br><br>' + pitcher + '&nbsppitching.';
							}
							else {
								multi_atbat = true;
								$(atbats).each(function(ab, atbat) {
										get_atbat_des(atbat);
										get_pitcher_by_id(pitchers, atbat.pitcher, function(p){
										pitcher = p
								});/////////
										description += 'At Bat ' + (atbat.num) + ": " + atbat.des + '<br><br>' + pitcher + '&nbsppitching<br><br>';
								});
							};
							cell.attr('id', 'atbat' + atbats[0].num);
							make_atbat_cell(cell, atbats[0], innings[b_inn - 1], description, multi_atbat);
						};
				});
			};	// for inn
	});	// batters.each
	
	function make_batter_popup(season, career, callback) {
		var table = $('<table class="popup_stats_table"></table>');
		$(table).append('<tr><td><th>Season</th><th>Career</th></tr>')
		$.each(season, function(key, val){
				$(table).append('<tr class="stats_row"><td>' + key + '</td><td>' + val + '</td><td>' + $(career).attr(key) + '</td></tr>');
		});
		callback(table);
	};
};	// make_batting_table

function make_atbat_cell(cell, atbat, inning, description, multi_atbat) {
	var index = inning.indexOf(atbat);
	cell.css('opacity', 1.0);
	cell.append('<div class="balls_strikes">' + atbat.b + '-' + atbat.s + '</div>');
	
	get_outs(atbat, index, inning, function(outs) {
			if (outs){ cell.append('<div class="out"><p>' + outs + '<p></div>') };
	});
	get_event(atbat, function(note, hit){
			if (note == 'Kc') {
				note = 'K';
				cell.append('<div class="note" id="called_strikeout">' + note + '</div>');
			}
			else {
				cell.append('<div class="note">' + note + '</div>');
			};
			if (hit) {cell.append('<div class="' + hit + '"></div>')};
	});
	get_bases(atbat, index, inning, function(onbase) {
			if (onbase) {
				$(onbase).each(function(i, base){
					cell.append('<div class="base' + base + '"></div>');
				});
			};
	});
	get_fielding(atbat.des, function(fielding) {
			if (fielding) {
				cell.append('<div class="fielding">' + fielding + '</div>');
			};
	});
	get_rbi(atbat.des, function(rbi) {
			if (rbi > 0) {
				cell.append('<div class="rbi"><p>' + rbi + '<p></div>');
			};
	});
	if ((atbat.des).match('Stolen')) {
		cell.append('<div class="stolen_base">SB</div>');
	};
	if (multi_atbat) {
		cell.append('<div class="multi_atbat">&#10753</div>');
	};
	cell.click(function(event){
			make_popup('At-Bat&nbsp' + atbat.num, description, event);
	});
	cell.hover(function(){
			cell.css('cursor', 'pointer');
	});
};

function make_pitching_table(home_or_away) {
	if (home_or_away == 'away') { var pitchers = away_pitchers, team = away_team };
	if (home_or_away == 'home') { var pitchers = home_pitchers, team = home_team };

	$('body').append('<br><br><div id="pitching_header"><hr><h1>Pitching</h1></div>');
	var pitching_table = $('<div class="pitching_table"></div>');
	var stat_row = $('<div class="row" id="stat_row"></div>');
	stat_row.append('<div class="player_box" id="player_dummy"></div>');
	pitching_table.append(stat_row);
	$('body').append(pitching_table);
	$('body').append('<br><hr>');
	$(['W-L', 'ERA', 'IP', 'BF', 'K', 'BB', 'H', 'R', 'ER']).each(function(i, entry) {
			stat_row.append('<div class="cell" id="inning_cell"><p>' + entry + '</p></div>');
	});
	
	$(pitchers).each(function(i, pitcher) {
			if (pitcher.id) {
				var row = $('<div class="row" id="stat_row"></div>');
				pitching_table.append(row);
				row.append('<div class="player_box" id="pitcher_box_' + pitcher.id + '">' + pitcher.name + '</div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.w + '-' + pitcher.l + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.era + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.ip + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.bf + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.so + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.bb + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.h + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.r + '</p></div>');
				row.append('<div class="cell" id="inning_cell"><p>' + pitcher.er + '</p></div></div>');
			
				$('#pitcher_box_' + pitcher.id).click(function(event){
						make_pitcher_popup(pitcher, function(table){
								make_popup(pitcher.name_display_first_last, $(table), event)
						});
				});
			};
			
			function make_pitcher_popup(pitcher, callback) {
				var table = $('<table class="popup_stats_table"></table>');
				$(table).append('<tr><td><th>Season</th><th>Career</th></tr>')
				
				$(table).append('<tr class="stats_row"><td>w-l</td><td>' + pitcher.season.w + '-' + pitcher.season.l + '</td><td>' + pitcher.career.w + '-' + pitcher.career.l + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>era</td><td>' + pitcher.season.era + '</td><td>' + pitcher.career.era + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>ip</td><td>' + pitcher.season.ip + '</td><td>' + pitcher.career.ip + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>sv</td><td>' + pitcher.season.sv + '</td><td>' + pitcher.career.sv + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>k</td><td>' + pitcher.season.so + '</td><td>' + pitcher.career.so + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>bb</td><td>' + pitcher.season.bb + '</td><td>' + pitcher.career.bb + '</td></tr>');
				
				$(table).append('<tr class="stats_row"><td>whip</td><td>' + pitcher.season.whip + '</td><td>' + pitcher.career.whip + '</td></tr>');
				callback(table);
			};
	});
	$('body').append('<br><br>');
	make_footer();
};

function make_footer(){
	$('body').append('<div id="footer"><div class="help_button"><p>?</p></div></div>');
	$('.help_button').click(function(event){
			make_help_box(function(help){
					make_popup('Scorecard Generator', help, event);
					$(help.parents()[1]).unbind('click');
			});
	});
	
	function make_help_box(callback) {
		var help = $('<div class="help_box"></div>');
		var help_tabs_div = $('<div id="help_tabs_div"></div>');
		var tab1 = $('<div class="help_tab" id="tab1">Cards</div>');
		var tab2 = $('<div class="help_tab" id="tab2">At Bat Cells</div>');
		var tab3 = $('<div class="help_tab" id="tab3">Notation</div>');
		var tab4 = $('<div class="help_tab" id="tab4">About</div>');
		help_tabs_div.append(tab1);
		help_tabs_div.append(tab2);
		help_tabs_div.append(tab3);
		help_tabs_div.append(tab4);
		help.append(help_tabs_div);
		
		var help_body = $('<div class="help_body"></div>');
		help.append(help_body);
		
		var card_help = $('<div id="help_card"></div>');
		var switch_div = $('<div id="help_switch_div"></div>');
		var switch_img = $('<img id="help_card_switch_img" src="' + $('#card_switch_image').attr('src')  + '">');
		switch_div.append('<div id="help_card_switch_text">Switch cards by clicking the small team image at the top-right of the page.</div>');
		switch_div.append(switch_img);
		card_help.append(switch_div);
		
		var player_div = $('<div id="help_player_div"></div>');
		var player_btn = $('<div id="help_player_box"  class="player_box">Robinson<br>#42&nbsp&nbsp2B</div>');
		player_div.append(player_btn);
		player_div.append('<p>Click on a player for season and career stats.</p>');
		card_help.append(player_div)
		
		var cell_div = $('<div id="help_cell_div"></div>');
		var cell_example = null;
		cell_div.append('<p>Click on an At Bat cell for a description.</p>');
		for (i = 1; i < 100; i++) {
			if ($('#atbat' + i).html()) {
					cell_example = $('#atbat' + i).html();
					continue;
			};
		};
		cell_div.append('<div class="cell" id="help_cell_example">' + cell_example + '</div>');
		card_help.append(cell_div);
		
		card_help.append('<br><p>Click any popup window to close it.</p>');
		
		tab1.click(function(){
			help_body.html(card_help);
			tab1.css('border-bottom', '3px solid green');
			tab2.css('border-bottom', 'none');
			tab3.css('border-bottom', 'none');
			tab4.css('border-bottom', 'none');
		});
		tab1.click();
		
		var cell_help = $('<div id="help_cell"></div>');
		cell_help.append('<p>Balls and Strikes are shown in the upper left.</p>');
		cell_help.append('<p>RBI are shown in the upper right.</p>');
		cell_help.append('<p>Fielding or Hit Location is shown in the lower left.</p>');
		cell_help.append('<p>Outs are shown in the lower right.</p>');
		cell_help.append('<p>Hit or Out Notation is shown in the center.</p>');
		cell_help.append('<p>Hits are shown by darkened base paths.</p>');
		cell_help.append('<p>Runners are shown by darkened bases.</p><br>');

		
		var hit_box = $('<div class="help_cell_box"></div>');
		var hit_cell = $('<div class="cell" id="help_cell_hit"></div>');
		hit_cell.append('<div class="spacer"></div>');
		hit_cell.append('<div class="diamond"></div>');
		hit_cell.append('<div class="base2"></div>');
		hit_cell.append('<div class="double"></div>');
		hit_cell.append('<div class="note">2B</div>');
		hit_cell.append('<div class="balls_strikes">3-2</div>');
		hit_cell.append('<div class="fielding">9</div>');
		hit_cell.append('<div class="rbi">1</div>');
		hit_box.append(hit_cell);
		hit_box.append('<p>This cell shows a 1 RBI Double, hit with a count of 3 balls and 2 strikes (3-2) to right field (9).</p>');
		cell_help.append(hit_box);
		
		var out_box = $('<div class="help_cell_box"></div>');
		var out_cell = $('<div class="cell" id="help_cell_out"></div>');
		out_cell.append('<div class="spacer"></div>');
		out_cell.append('<div class="diamond"></div>');
		out_cell.append('<div class="base3"></div>');
		out_cell.append('<div class="note">DP</div>');
		out_cell.append('<div class="balls_strikes">2-1</div>');
		out_cell.append('<div class="fielding">6-4-3</div>');
		out_cell.append('<div class="out">3</div>');
		out_box.append(out_cell);
		out_box.append('<p>This cell shows a Double Play, fielded from shortstop to second to first (6-4-3), producing the third out (3) and stranding a runner on third base.</p>');
		cell_help.append(out_box);
		
		tab2.click(function(){
			help_body.html(cell_help);
			tab2.css('border-bottom', '3px solid green');
			tab1.css('border-bottom', 'none');
			tab3.css('border-bottom', 'none');
			tab4.css('border-bottom', 'none');
		});
		
		var note_help = $('<div id="help_note"></div>');
		var note_table = $('<table id="help_note_table"></table>');
		note_help.append(note_table);
		note_table.append('<tr><td>1B - Single</td><td>K - Swinging Strike Out</td></tr>');
		note_table.append('<tr><td>2B - Double</td><td><big>&#670</big> - Called Strike Out</td></tr>');
		note_table.append('<tr><td>3B - Triple</td><td>F - Fly Out</td></tr>');
		note_table.append('<tr><td>HR - Home Run</td><td>P - Pop Out</td></tr>');
		note_table.append('<tr><td>BB - Walk</td><td>L - Line Out</td></tr>');
		note_table.append('<tr><td>IBB - Intentional Walk</td><td>G - Ground Out</td></tr>');
		note_table.append('<tr><td>HBP - Hit By Pitch</td><td>FO - Force Out</td></tr>');
		note_table.append("<tr><td>GR - Ground Rule</td><td>FC - Fielder's Choice</td></tr>");
		note_table.append('<tr><td>SB - Stolen Base</td><td>DP - Double Play</td></tr>');
		note_table.append('<tr><td>SAC - Sacrifice Play</td><td>TP - Triple Play</td></tr>');
		note_table.append('<tr><td></td><td>CS - Caught Stealing</td></tr>');
		note_table.append('<tr><td></td><td>INT - Interference</td></tr>');
		note_table.append('<tr><td></td><td>E - Error</td></tr>');
		note_help.append('<p>+ &nbsp - Mutliple At Bats in Inning</p>');
		
		tab3.click(function(){
			help_body.html(note_help);
			tab3.css('border-bottom', '3px solid green');
			tab1.css('border-bottom', 'none');
			tab2.css('border-bottom', 'none');
			tab4.css('border-bottom', 'none');
		});
		
		var about_help = $('<div id="help_about"></div>');
		about_help.append('<br><p>jScorecard &#169 2013 J. Kaiden</p>');
		about_help.append('<a class="help_link" rel="license" href="http://creativecommons.org/licenses/by-nc/3.0/deed.en_US"></a><br /><span>Licensed under a <a class="help_link" rel="license" href="http://creativecommons.org/licenses/by-nc/3.0/deed.en_US">Creative Commons Attribution-NonCommercial 3.0 Unported License</a><br><br>Source at:&nbsp<a class="help_link" xmlns:dct="http://purl.org/dc/terms/" href="https://github.com/lljk/jscorecard" rel="dct:source">https://github.com/lljk/jscorecard</a><br><br><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc/3.0/88x31.png" /></span>');
		about_help.append('<p>All documents retrieved by this application are proprietary content of MLB Advanced Media, L.P ("MLBAM").</p>');
		about_help.append('<a class="help_link" href="http://gdx.mlb.com/components/copyright.txt">see MLBAM copyright</a><br><br>');
		
		
		tab4.click(function(){
			help_body.html(about_help);
			tab4.css('border-bottom', '3px solid green');
			tab1.css('border-bottom', 'none');
			tab2.css('border-bottom', 'none');
			tab3.css('border-bottom', 'none');
			$('.help_link').attr({target: '_blank'});  // opens in new tab
		});
		
		var close_btn = $('<div id="help_close_button">ok</div>');
		close_btn.click(function(){$(help).parents()[1].remove()});
		help.append(close_btn);
		
		callback(help);
	};
}

function make_popup(title, body, click_event){
	if ($('.popup_box')) {$('.popup_box').remove()};
	var d = new Date(); id = d.getTime();
	popup_box = $('<div class="popup_box" id="popup_box' + id + '"></div>');
	$('body').append(popup_box);
	popup_box.append('<div class="popup_title" id="popup_title' + id + '">' + title + '</div>')
	popup_box.append('<div class="popup_body" id="popup_body' + id + '"></div>');
	$('#popup_body' + id).html(body);

	var top = click_event.pageY - (popup_box.prop('clientHeight') / 2);
	var left = click_event.pageX;
	var width = click_event.view.innerWidth;	
	if (left / width < 0.5) {popup_box.css('left', left + 5)}
	else {popup_box.css('right', width - left)};
	popup_box.css("top", top + 20);
	
	popup_box.click(function(){
			popup_box.remove();
	});
	
};	///////////EOF/////////////////