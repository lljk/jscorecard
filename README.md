jScorecard
==========

baseball scorecard generator


  If you care about baseball half as much as I do, odds are you've scored a game or two...  I've been living abroad for a good long while - and the truth is that folks where I am are clueless about baseball... their loss.  Anyway, here's an app I worked out to generate html scorecards so I can check out the games the next day in a way that's sensible (to me at least...) even if i can't actually talk to anyone about it ;)

  To use the thing:
  
  Download and extract the zip file, then open 'jScorecard.html'.

  Select a date and game, and then click 'make'.
  
  The away team's card is shown first. To switch cards, click the opposing team's image to the right of the game header.
  
  Clicking an at bat cell will show the description of the at bat in a popup box.  Clicking a player will show their season and career stats.  Clicking anywhere on an open popup box will close it.

  Everyone scores games a little differently, so here are some notes about my notation:

  Balls and strikes are shown in the upper left hand corner of each at bat cell, fielding or hit location in the lower left.  Rbi's are shown in the upper right corner, and outs in the lower right.

  Base hits are shown as a darkened path to the base, runners with darkened bases.

  The result of each at bat is shown in the center, and is noted as follows:

  * 1B - Single
  * 2B - Double
  * 3B - Triple
  * HR - Home Run
  * BB - Walk
  * IBB - Intentional Walk
  * HBP - Hit by Pitch
  * K - Strikeout Swinging
  * (backwards)K - Strikeout Looking
  * F - Fly Out
  * P - Pop Out
  * L - Line Out
  * G - Ground Out
  * F0 - Force Out
  * FC - Fielder's Choice
  * DP - Double Play
  * TP - Triple Play
  * SAC - Sacrifice Play
  * SB - Stolen Base
  * INT - Interference
  * E - Error

  If a batter had more than one at bat in an inning, '+' is shown below the at bat result.
  
  There's a help button at the bottom right of the page which gives more info.

  I've noticed that this works best for recent games, as not all of the data necessary to generate the scorecards is available for older games - for example, I tried creating cards for the 2004 ALCS game 7 for the screenshot (being a Red Sox fan,) and it didn't work :(

  Still got some work to do on the thing, but hopefully it'll mostly work.

  Go Sox!

  - j
