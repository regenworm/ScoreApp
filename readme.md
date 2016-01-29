# Introduction

Score-app is a web application built with meteor to keep track of tournaments using leaguevine. 

# Features

The application features a navigation bar based on the tournaments added, the navigation shows the tournaments and unfolds the fields which in turn unfold the games.

Users can update the gamescore, visual cues for the teams, status of the game and the location of the field. All of these features will be saved in the database and updated for all users.

The app also includes an admin panel to which access can be claimed by going to <yourhost.com>/admin . From the admin panel you will have access to users, tournaments, admins, games, score update logs and fields.

# Documentation

## Structure

### Main

The main template is used as wrapper for the entire app. It loads the navigation bar and the rest of the pages are yielded in this template.

#### Navigation

The menuItems template lists all of the tournaments and basic pages like home and register. It loads the tournaments and displays them in the template called menuTournament.

The menuTournament template loads all of the information on tournaments and loops over the fields associated to display these. These fields are loaded into the template menuFields.

The menuFields template loads all of the games related to this specific field and displays these.

### Pages

The homePage template is the first page a user sees when opening the app, at the moment it only contains a welcome message.

The fieldView template is the page where all of the fields with games are listed and can be sorted according to their distance to the user. 

The field_games template is the page where user ends up when clicking a field in the fieldView page. This page displays a list of games happening on the field that was clicked. The list is ordered according to starting time of the games.

The gameView template shows a page which displays all of the information associated with a game. Users can change the scores, location of the field and status of the game here. By clicking the teamname users can also change the visual cue for a team. This brings up the viscue template.

The viscue template is loaded in a modal on top of the page. On this page users can change the visual cues for users.

The register and loginpage templates speak for themselves.



## Functions

This section breaks down all of the functions in the score-app javascript file except for the routes. 
Functions are ordered by type (e.g. helper function or event function) and then ordered by associated template.
Furthermore the functions are presented in the same order as in the javascript file.

### Client-side-code

#### Helper Functions
      -menuItems.helpers
          *tournament
          find all tournaments

          'admin_status'
          *(check admin)
      -menuTournament.helpers
          'field'
          *(find all fields from a tournament)
      -menuField.helpers
          'game'
          *(find all games from a field)
      -field_games.helpers
          'game'
          *(return the games of a field)

          'parsed_time'
          *(parse start time of a game)
 
          'tournament_id'
          *(get tournament id)
      -gameView.helpers
          'parsed_time'
          *(parse start time of a game)

          'init_page'
          *(if score final, show overlay that blocks buttons)         

          'tournament_name'
          *(get tournament name)

          'field_name'
          *(get field name)

          'over_time'
          *(check if game was more than two weeks ago)
      -viscue.helpers
          'init_page'
          *(check colour for teams in games, set select 
            to that colour)

          'team_1_name'
          *(get name for team 1)
 
          'team_2_name'
          *(get name for team 2)
      -fieldView.helpers
          'settings'
          *(get distance to fields from user)
 
 
 
#### Event Functions
      -main.events
          'click #gps'
          *(set user gps location)
 
          'click #toggle'
          *(toggle sidebar)
      -fieldView.events
          'click .reactive-table tbody tr'
          *(go to field clicked from field)
      -menuItems.events
          'click .logout'
          *(logout a user)
      -menuTournament.events
          'click .tournament'
          *(unfold clicked tournament)

          'click .tournament'
          *(unfold clicked field)
      -gameView.events
          'click #nextGame'
          *(go to next game on field)

          'click #prevGame'
          *(go to previous game on field)

          'click #setGps'
          *(set field to user gps location)

          'click #team1plus'
          *(increase team 1 score by 1)

          'click #team2Plus'
          *(increase team 2 score by 1)

          'click #team1Minus'
          *(decrease team 1 score by 1)

          'click #team2Minus'
          *(decrease team 2 score by 1)

          'click viscueTeam1'
          *(if teamname is clicked open modal to let user choose visual cues)

          'click viscueTeam2'
          *(if teamname is clicked open modal to let user choose visual cues)
  
          'click #isFinal'
          *(if game is done and score shouldnt be adjusted, block score buttons with overlay)

      -viscue.events
          'change #colorpicker1'
          *(change visual cue for team 1)

          'change #colorpicker2'
          *(change visual cue for team 2)

          'click #exit'
          *(exit visual cue picker modal by clicking cross)
 
 
#### OnRendered Functions

      -main.OnRendered
      *(initialise sidebar instance)

          
      (loginPage.events prevents event default for the submit form button)

      -loginPage.onRendered
      *(validate login)

      (registerPage.events prevents event default for the submit form button)
      
      -registerPage.onRendered
      *(validate register)
 

### Server-side-code
      -kadira code for debugging
      -houston code to add users and admins to adminpanel

      -Methods
          Following methods pull data from leaguevine and
          insert it into the database:
              -updateTournament
              -updateGames
              -updateFields
          Following method pushes scores to leaguevine:
              -updateScore

      -SyncedCron: runs every 2 minutes to sync database with leaguevine
