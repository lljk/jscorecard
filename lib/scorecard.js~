/*
	This file is part of: jScorecard (c) 2013 J. Kaiden
	https://github.com/lljk/jscorecard
	licensed under a Creative Commons Attribution-NonCommercial 3.0 Unported License.
	http://creativecommons.org/licenses/by-nc/3.0/deed.en_US
*/

var local_get = true, local_save = false;	///// for testing

 $(document).ready(function() {

 if(local_get) {
  epg = JSON.parse(localStorage.epg);
  away_team = JSON.parse(localStorage.away_team);
  home_team = JSON.parse(localStorage.home_team);
  away_pitchers = JSON.parse(localStorage.away_pitchers);//.split(',');
  home_pitchers = JSON.parse(localStorage.home_pitchers);//.split(',');
  boxscore = JSON.parse(localStorage.boxscore);
  away_batters = JSON.parse(localStorage.away_batters);
  home_batters = JSON.parse(localStorage.home_batters);
  away_innings = JSON.parse(localStorage.away_innings);
  home_innings = JSON.parse(localStorage.home_innings);
  away_actions = JSON.parse(localStorage.away_actions);
  home_actions = JSON.parse(localStorage.home_actions);
  date = localStorage.date;
  park = localStorage.park;

  make_header('away', away_team, home_team, boxscore, date, park);  
  make_batting_table('away');
  make_pitching_table('away');
 }
 
 else {
   make_input_form()
 };

});

 /// EOF ///
