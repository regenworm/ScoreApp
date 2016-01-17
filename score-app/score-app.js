var Tournaments = new Meteor.Collection('tournaments');
var Games = new Meteor.Collection('games');
var Fields = new Meteor.Collection('fields');

// Routes-----------------------------------------------------------------------
Router.configure( {
    layoutTemplate: 'main',
    loadingTemplate: 'loading'
});
Router.route('/', {
    name: 'home',
    template: 'homePage',
});
Router.route('/field_overview', {
    name: 'field_overview',
    template: 'fieldView',
    onBeforeAction: function() {
        var current_user = Meteor.userId();
        if (current_user) {
            this.next();
        }
        else {
            Router.go('login');
        }
    }
});
Router.route('/field/:id', {
    name: 'field_games',
    template: 'field_games',
    data: function() {
        var current_field = parseInt(this.params["id"]);
        return Fields.findOne({id: current_field});
    },
    onBeforeAction: function() {
        var current_user = Meteor.userId();
        if (current_user) {
            this.next();
        }
        else {
            Router.go('login');
        }
    }
});
Router.route('/register', {
    template: 'registerPage',
    onBeforeAction: function() {
        var current_user = Meteor.userId();
        if (current_user) {
            Router.go('home');
        }
        else {
            this.next();
        }
    }
});
Router.route('/login', {
    template: 'loginPage',
    onBeforeAction: function() {
        var current_user = Meteor.userId();
        if (current_user) {
            Router.go('home');
        }
        else {
            this.next();
        }
    }
});
Router.route('/game/:id', {
    name: 'game',
    template: 'gameView',
    data: function() {
        var current_game = parseInt(this.params["id"]);
        return Games.findOne({id: current_game});
    },
    onBeforeAction: function() {
        var current_user = Meteor.userId();
        if (current_user) {
            this.next();
        }
        else {
            Router.go('login');
        }
    }
});

// Auto-close the sidebar on route stop (when navigating to a new route)
Router.onStop(function () {
    if (slideout) {
      slideout.close();
    }
});

if (Meteor.isClient) {
    // Helper functions---------------------------------------------------------
    // Find all tournaments
    Template.menuItems.helpers( {
        'tournament': function() {
            return Tournaments.find({}, {sort: {name: 1}});
        },
        // check if user is admin
        'admin_status': function() {
            if (Houston._admins.find({user_id: Meteor.userId()}).count() > 0) {
                return true
            } else {
                return false
            }
        }
    });

    // Find all fields from the given tournament
    Template.menuTournament.helpers( {
        'field': function() {
            return Fields.find({tournament_id: this.id}, {sort: {name: 1}});
        }
    });

    // Find all games from the given field
    Template.menuField.helpers( {
        'game': function() {
            return Games.find({game_site_id: this.id});
        }
    });

    // Return the games of a field
    Template.field_games.helpers( {
        'game': function() {
            if(!this.games){
                return;
            }
            var related_games = this.games;
            Fields.find({related_field: this.id}).forEach( function(field) {
                related_games = related_games.concat(field["games"]);
            });
            return Games.find({id: {$in: related_games}}, {sort: {'start_time': 1}});
        },
        'parsed_time': function() {
            return moment(this['start_time']).format('Do MMMM, h:mm a');
        },
        'tournament_id': function() {
            return Tournaments.findOne({id: this["tournament_id"]})["name"];
        }
    });

    Template.gameView.helpers({
        'parsed_time': function() {
            return moment(this['start_time']).format('Do MMMM, h:mm a');
        },
        'init_page': function() {
            if (this["is_final"]) {
                $("div.overlay_score").css({"display": "block"});
            } else {
                $("div.overlay_score").css({"display": "none"});
            }
        },
        'tournament_name': function() {
            var tournament = Tournaments.findOne({id: this["tournament_id"]});
            if(!tournament) {
                return;
            }
            return tournament["name"];
        },
        'field_name': function() {
            var field = Fields.findOne({id: this["game_site_id"]});
            if(!field) {
                return;
            }
            return field["name"];
        },
        'over_time': function() {
            if(moment().diff(moment(this["start_time"]), "weeks", true) > 2) {
                return true;   
            }
        }
    });

    Template.viscue.helpers({
        // Set colourpicker value on load
        'init_page': function() {
            var col1 = current_game["team_1_col"];
            var col2 = current_game["team_2_col"];
            if (col1) {
                $('#colorpicker1').val(col1);
            }
            if (col2) {
                $('#colorpicker2').val(col2);
            }
        },
        'team_1_name': function() {
            return current_game["team_1_name"];
        },
        'team_2_name': function() {
            return current_game["team_2_name"];
        }
    });

    // Find all the fields
    Template.fieldView.helpers({
        settings: function() {
            return {
                collection: Fields.find({related_field: null}),
                showNavigation: 'always',
                fields: [
                    {key: 'name', label: 'Name'}, 
                    {
                        key: 'location', label: 'Distance',
                        // Calculate the distances
                        fn: function(field_pos, field) {
                            var cur_pos = Session.get("cur_pos");
                            if(field_pos && cur_pos) {
                                var distance = geolib.getDistance(
                                    {latitude: cur_pos.latitude, longitude: cur_pos.longitude},
                                    {latitude: field_pos.latitude, longitude: field_pos.longitude}
                                );
                                distance = distance/1000
                                if(distance < 10) {
                                    return distance.toFixed(3) + " km";
                                }
                                else if(distance < 100) {
                                    return distance.toFixed(2) + " km";
                                }
                                else {
                                    return distance.toFixed(1) + " km";
                                }
                            }
                            else {
                                if(!cur_pos) {
                                    return "Set your location!";
                                }
                                return "Unknown";
                            }
                        }
                    }]
            };
        }
    });

    // Event functions----------------------------------------------------------
    Template.main.events({
        // Set your gps location.
        'click #gps': function() {
            Location.locate(function(pos){
                Session.setAuth("cur_pos", pos);
            }, function(err){
                console.log("Oops! There was an error", err);
            });
        },
    });

    Template.fieldView.events( {
        // When a user clicks on a field entry in the field overview table.
        'click .reactive-table tbody tr': function(event) {
            var field = this;
            Router.go('field_games', this);
        }
    });

    var slideout;
    Template.main.events({
        // Sidebar toggle.
        'click #toggle': function (e) {
            slideout.toggle();
        }
    });

    Template.menuItems.events( {
        // When a user logs out.
        'click .logout': function(event) {
            event.preventDefault();
            Meteor.logout();
            Router.go('login');
        }
    });

    // When the user clicks on a menu entry, show/hide.
    Template.menuTournament.events( {
        'click .tournament': function(event) {
            $(event.target).siblings().slideToggle();
        },
        'click .field': function(event) {
            $(event.target).siblings().slideToggle();
        }
    });

    Template.gameView.events({
        // If the next game button has been pressed, check if there is a 
        // next game and if there is go to the game page, else warning.
        'click #nextGame': function() {
            var current_game = this;
            // Get the array of related games from this field.
            var related_games = Fields.findOne({id: current_game["game_site_id"]})["games"];

            // Find on other fields.
            Fields.find({related_field: current_game.id}).forEach( function(field) {
                related_games = related_games.concat(field["games"]);
            });

            temp = []
            // Find for all related games and sort them on start time.
            Games.find({id: {$in: related_games}}, {sort: {'start_time': 1}}).forEach(function (game) {
                temp.push(game["id"])
            });
            
            related_games = temp;
            game_index = related_games.indexOf(current_game["id"]);


            // Check if you are the last game, if not make a new path with the
            // game index of next game.
            if (game_index+1 < related_games.length) {
                game_index = related_games[game_index+1]
                path = '/game/'+game_index + '/';
                Router.go(path);
            } else {
                AntiModals.alert("This is the last game on this field.");
            }
        },

        // If the previous game button has been pressed, check if there is a 
        // previous game and if there is go to the game page, else warning.
        'click #prevGame': function() {
            var current_game = this;
            // Get the array of related games from this field.
            var related_games = Fields.findOne({id: current_game["game_site_id"]})["games"];

            // Find on other fields.
            Fields.find({related_field: current_game.id}).forEach( function(field) {
                related_games = related_games.concat(field["games"]);
            });

            temp = []
            // Find for all related games and sort them on start time.
            Games.find({id: {$in: related_games}}, {sort: {'start_time': 1}}).forEach(function (game) {
                temp.push(game["id"])
            });
            
            related_games = temp;
            game_index = related_games.indexOf(this["id"]);

            // Check if you are the first game, if not make a new path with the
            // game index of previous game.
            if (game_index > 0) {
                game_index = related_games[game_index-1]
                path = '/game/'+game_index + '/';
                Router.go(path);
            } else {
                AntiModals.alert("This is the first game on this field.");
            }
        },

        // If the set gps button has been pressed, set this field's location to
        // the user's location.
        'click #setGps': function() {
            var pos = Session.get("cur_pos");
            // If the user has given his location.
            if (pos) {
                var current_game = this;
                var current_field = Fields.findOne({id: current_game["game_site_id"]});
                Fields.update(
                    {_id: current_field["_id"]}, 
                    {$set: 
                        {location: pos}
                    }
                );
            } else {
                AntiModals.alert("Please set your gps location first by clicking the gps button next to the menu button!")
            }
        },

        // If the team 1 plus button has been pressed, update the score and add
        // a new history entry.
        'click #team1Plus': function () {
            var current_game = this;
            // The score may be changed if the game is not final.
            if (current_game["is_final"] == false) {
                 Games.update(
                    {_id: current_game['_id']},
                    {$inc:
                        {team_1_score: 1},
                        $push: {
                            history: {
                                user: Meteor.userId(), 
                                type:'team1+'
                            }
                        }
                    }
                );

                // If there is an error while updating the updateScore method 
                // will return true and there will be a warning.
                if (Meteor.call('updateScore', current_game["id"])) {
                    AntiModals.alert("An error occured, please try again.");
                }
            }
        },

        // If the team 2 plus button has been pressed, update the score and add
        // a new history entry.
        'click #team2Plus': function () {
            var current_game = this;
            // The score may be changed if the game is not final.
            if (current_game["is_final"] == false) {
                Games.update(
                    {_id: current_game['_id']},
                    {$inc:
                        {team_2_score: 1},
                        $push: {
                            history: {
                                user: Meteor.userId(), 
                                type:'team2+'
                            }
                        }
                    }
                );

                // If there is an error while updating the updateScore method 
                // will return true and there will be a warning.     
                if (Meteor.call('updateScore', current_game["id"])) {
                    AntiModals.alert("An error occured, please try again.");
                }
            }
        },

        // If the team 1 minus button has been pressed, update the score and add
        // a new history entry.
        'click #team1Minus': function () {
            var current_game = this;
            // The score may not go negative and the score can only be changed
            // if the game is not final.
            if (current_game["team_1_score"] != 0 && 
                current_game["is_final"] == false) {
                Games.update(
                    {_id: current_game['_id']},
                    {$inc: 
                        {team_1_score: -1},
                        $push: {
                            history: {
                                user: Meteor.userId(), 
                                type:'team1-'
                            }
                        }
                    }
                );

                // If there is an error while updating the updateScore method 
                // will return true and there will be a warning.               
                if (Meteor.call('updateScore', current_game["id"])) {
                    AntiModals.alert("An error occured, please try again.");
                }
            };
        },

        // If the team 2 minus button has been pressed, update the score and add
        // a new history entry.
        'click #team2Minus': function () {
            var current_game = this;
            // The score may not go negative and the score can only be changed
            // if the game is not final.
            if (current_game["team_2_score"] != 0 && 
                current_game["is_final"] == false) {
                Games.update(
                    {_id: current_game['_id']},
                    {$inc: 
                        {team_2_score: -1},
                        $push: {
                            history: {
                                user: Meteor.userId(), 
                                type:'team2-'
                            }
                        }
                    }
                );

                // If there is an error while updating the updateScore method 
                // will return true and there will be a warning.    
                if (Meteor.call('updateScore', current_game["id"])) {
                    AntiModals.alert("An error occured, please try again.");
                }
            };
        },

        // When the visual cue of team 1 is pressed, open the colorpicker 
        // overlay.
        'click #viscueTeam1': function() {
            current_game = this;
            AntiModals.overlay("viscue", current_game);
        },

        // When the visual cue of team 2 is pressed, open the colorpicker 
        // overlay.
        'click #viscueTeam2': function() {
            current_game = this;
            AntiModals.overlay("viscue", current_game);
        },

        // When the final button has been pressed, change the final boolean and
        // toggle the overlay.
        'click #isFinal': function () {
            event.preventDefault();
            Games.update(
                {_id: this['_id']},
                {$set: 
                    {is_final: !this["is_final"]}
                }
            ); 
            $("div.overlay").fadeToggle("fast");
        }
    });

    // Colorpicker overlay for teams.
    Template.viscue.events({
        // The current game is passed from the click event.

        // When team 1's colorpicker changes, find all games where it plays and
        // change the color if it the same or later start time.
        'change #colorpicker1': function () {
            color = $('#colorpicker1').val();
            // Find all games where team 1 plays as team 1.
            Games.find({team_1_id: current_game["team_1_id"]}).forEach(function (other_game) {
                if (moment(current_game.start_time).isAfter(other_game.start_time) || 
                    current_game._id == other_game._id) {
                    Games.update(
                        {_id: other_game._id},
                        {$set: 
                            {team_1_col: color}
                        }
                    );
                }            
            });
            // Find all games where team 1 plays as team 2.
            Games.find({team_2_id: current_game["team_1_id"]}).forEach(function (other_game) {
                if (moment(current_game.start_time).isAfter(other_game.start_time) || 
                    current_game._id == other_game._id) {
                    Games.update(
                        {_id: other_game._id},
                        {$set: 
                            {team_2_col: color}
                        }
                    );
                }           
            });
            AntiModals.dismissOverlay($('.anti-modal-overlay'));
        },

        // When team 2's colorpicker changes, find all games where it plays and
        // change the color if it the same or later start time.
        'change #colorpicker2': function () {
            color = $('#colorpicker2').val();
            // Find all games where team 2 plays as team 1.
            Games.find({team_1_id: current_game["team_2_id"]}).forEach(function (other_game) {
                if (moment(current_game.start_time).isAfter(other_game.start_time) || 
                    current_game._id == other_game._id) {

                    Games.update(
                        {_id: other_game._id},
                        {$set:
                            {team_1_col: color}
                        }
                    );
                }             
            });
            // Find all games where team 2 plays as team 2.
            Games.find({team_2_id: current_game["team_2_id"]}).forEach(function (other_game) {
                if (moment(current_game.start_time).isAfter(other_game.start_time) || 
                    current_game._id == other_game._id) {
                    Games.update(
                        {_id: other_game._id},
                        {$set:
                            {team_2_col: color}
                        }
                    );
                }             
            });
            AntiModals.dismissOverlay($('.anti-modal-overlay'));
        },
        // When the exit button has been pressed, close the overlay
        'click #exit': function () {
            AntiModals.dismissOverlay($('.anti-modal-overlay'));
        }
    });

    // onRendered functions-----------------------------------------------------
    // Sidebar instance initialisation.
    Template.main.onRendered(function () {
        var template = this;
        slideout = new Slideout({
            'panel': template.$('#content').get(0),
            'menu': template.$('#slideout-menu').get(0),
            'padding': 300,
            'tolerance': 70
        });
    });


    // Login, register and logout-----------------------------------------------
    // Default messages for errors for login and register.
    $.validator.setDefaults( {
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            email: {
                required: "You must enter an email address.",
                email: "You've entered an invalid email address."
            },
            password: {
                required: "You must enter a password.",
                minlength: "You password must be at least {0} characters.",
                password: "You've entered an invalid password."
            }
        }
    });

    // Login form submit button prevent.
    Template.loginPage.events( {
        'submit form': function(event) {
            event.preventDefault();
        }
    });
    // Validate login.
    Template.loginPage.onRendered(function() {
        var validator = $('.login').validate( {
            submitHandler: function(event) {
                var email = $('[name=email]').val();
                var password = $('[name=password]').val();
                Meteor.loginWithPassword(email, password, function(error) {
                    if (error) {
                        if (error.reason == "User not found") {
                            validator.showErrors( {
                                email: "That email doesn't belong to a registered user."
                            });
                        }
                        if (error.reason == "Incorrect password") {
                            validator.showErrors( {
                                password: "You entered an incorrect password."
                            });
                        }
                    }
                    else {
                        Router.go('home');
                    }
                });
            }
        });
    });

    // Register form submit button prevent.
    Template.registerPage.events( {
        'submit form': function() {
            event.preventDefault();
        }
    });
    // Validate register.
    Template.registerPage.onRendered(function() {
        var validator = $('.register').validate( {
            submitHandler: function(event) {
                var email = $('[name=email]').val();
                var password = $('[name=password]').val();
                Accounts.createUser( {
                    email: email,
                    password: password
                }, function(error) {
                    if (error) {
                        if (error.reason == "Email already exists.") {
                            validator.showErrors( {
                                email: "That email already belongs to a registered user."
                            });
                        }
                    }
                    else {
                        Router.go('home');
                    }
                });
            }
        });
    });
}

if(Meteor.isServer) {
    Houston.add_collection(Meteor.users);
    Houston.add_collection(Houston._admins);

    // Methods------------------------------------------------------------------
    Meteor.methods({
        // Checks if there are new tournaments.
        updateTournament: function(tids) {
            this.unblock();

            // Remove blank spaces and replace comma's and brackets by encoded
            // characters, so all tids can be retrieved.
            tid = (("%5B"+tids.toString()+"%5D").replace(/,/g, "%2C")).replace(/ /g, "");
            var results = Meteor.http.get("https://api.leaguevine.com/v1/tournaments/?tournament_ids=" + tid );
            while (true) {
                results.data["objects"].forEach(function (tournament_data) {
                    var tournament_found = Tournaments.find({id: tournament_data["id"]}).count();

                    if (!tournament_found) {
                        Tournaments.insert({
                            id: tournament_data["id"], 
                            name: tournament_data["name"],
                            sync: true
                        });
                    }
                });

                // If there is no next, the update of tournaments is done.
                if (results.data["meta"]["next"] === null) {
                    break;
                }
                // Else get the new page of tournaments.
                results = Meteor.http.get(results.data["meta"]["next"]);
            } 
        },

        // Checks if there are new games or that games need to be updated.
        updateGames: function(tid) {
            this.unblock();
            var results = Meteor.http.get("https://api.leaguevine.com/v1/games/?tournament_id=" + tid + "&limit=200");
            while (true) {
                results["data"]["objects"].forEach(function (match) {
                    // We don't want games which don't have both teams defined.
                    if (match["team_1_id"] === null || 
                        match["team_2_id"] === null || 
                        typeof(match["team_1_id"]) === undefined || 
                        typeof(match["team_2_id"]) === undefined) {
                        return false;
                    }

                    // Get the game score data.
                    var game_scores = Meteor.http.get("https://api.leaguevine.com/v1/game_scores/?game_id=" + match["id"]);

                    // We want the last update of the game score, else if there
                    // were no game score updates, we set it to the last update
                    // of the match.
                    var scores_last_updated = match["time_last_updated"];
                    if (game_scores["data"]["meta"] > 0) {
                        scores_last_updated = game_scores["data"]["objects"][0]["time_last_updated"];
                    }

                    // Default score final is false, unless it is specified in
                    // the game score data.
                    var score_final = false;
                    if (game_scores["data"]["objects"].length > 0 ) {
                        score_final = game_scores["data"]["objects"][0]["is_final"];
                    }

                    var game_found = Games.find({id: match["id"]}).count();
                    var new_score = moment(Games.find({id: match["id"]})["scores_last_updated"]).isBefore(scores_last_updated)
                    var new_match_stats = moment(Games.find({id: match["id"]})["time_last_updated"]).isBefore(match["time_last_updated"])

                    // If there is a new game or if a game needs to be updated
                    // or if there is a new score.
                    if (!game_found || new_match_stats || new_score) {
                        var current_game = {
                            team_1_id: match["team_1_id"],
                            team_1_name: match["team_1"]["name"],
                            team_1_score: match["team_1_score"],
                            team_2_id: match["team_2_id"],
                            team_2_name: match["team_2"]["name"],
                            team_2_score: match["team_2_score"],
                            start_time: Date.parse(match["start_time"]),
                            is_final: score_final,
                            score_last_updated: scores_last_updated
                        };

                        // Some stats if there is no new score.
                        if (!new_score) {
                            current_game["id"] = match["id"]
                            current_game["game_site_id"] = match["game_site_id"]
                            current_game["tournament_id"] = match["tournament_id"]
                            current_game["time_last_updated"] = match["time_last_updated"]
                        }

                        // If it is a new game, the team colors will be white,
                        // the history will be an empty array and the game will 
                        // be inserted, else it will just be updated.
                        if (!game_found) {
                            current_game["team_1_col"] = "#fff";
                            current_game["team_2col"] = "#fff";
                            current_game["history"] = []
                            Games.insert(current_game);
                        } else {
                            Games.update(
                                {id: match["id"]},
                                {$set: current_game}
                            );
                        }
                    }
                });

                // If there is no next, the update of games is done.
                if (results["data"]["meta"]["next"] === null) {
                    break;
                }
                // Else get the new page of games.
                results = Meteor.http.get(results["data"]["meta"]["next"]);
            }
        },

        // Checks if there are new fields or that fields need to be updated.
        updateFields: function(tid) {
            this.unblock();
            var results = Meteor.http.get("https://api.leaguevine.com/v1/game_sites/?tournament_id=" + tid + "&limit=200");
            while (true) {
                results["data"]["objects"].forEach(function (game_site) {
                    var cur_id = game_site["id"];
                    var field_found = Fields.find({id: cur_id}).count();
                    var games_found_with_game_site = Games.find({game_site_id: cur_id}).count();
                    var new_field_stats = moment(Fields.find({id: cur_id})["time_last_updated"]).isBefore(game_site["time_last_updated"]);

                    // If there is a game added with a new field or if a field has been updated
                    if((!field_found && games_found_with_game_site) || 
                        (field_found && games_found_with_game_site && new_field_stats)) {

                        // Keep track of the tournaments which are held on this 
                        // field and of the games that are also played on this 
                        // field.
                        var related_tournaments = [];
                        var related_games = [];
                        Games.find({game_site_id: cur_id}).forEach(function (game) {
                            related_tournaments.push(game["tournament_id"]);
                            related_games.push(game["id"]);
                        });

                        // Create the field name.
                        // Checks if this field name is already in use. If it 
                        // is, it will keep track of the id of the first field 
                        // in the database that has this name (for merging 
                        // purpose on a field page to list all games from 
                        // different tournaments that play on this field).
                        var related_field = null;
                        var cur_name = game_site["event_site"]["name"] + ", " + game_site["name"];
                        var field = Fields.findOne({name: cur_name});
                        if(field) {
                            related_field = field["id"];
                        }

                        var current_field = {
                            id: cur_id,
                            name: cur_name,
                            description: game_site["event_site"]["description"],
                            tournament_id: related_tournaments,
                            games: related_games,
                            related_field: related_field,
                            time_last_updated: game_site["time_last_updated"]
                        };

                        // If it is a new field, it will have its location set
                        // to 0 and inserted in the database. Else it will just
                        // be updated.
                        if (!field_found && games_found_with_game_site) {
                            current_field["location"] = 0
                            Fields.insert(current_field);
                        } else {
                            Fields.update(
                                {id: cur_id},
                                {$set: current_field}
                            );
                        }
                    }
                });

                // If there is no next, the update of fields is done.
                if (results["data"]["meta"]["next"] === null) {
                    break;
                }
                // Else get the new page of fields.
                results = Meteor.http.get(results["data"]["meta"]["next"]);
            }
        },

        // Will be called when a user changes the score.
        // Push the score to LeagueVine.
        updateScore: function(game) {
            game = Games.findOne({id: game});
            var requestbody = {
                'data': {
                    'game_id': game["id"],
                    'team_1_id': game["team_1_id"],
                    'team_2_id': game["team_2_id"],
                    'team_1_score': game["team_1_score"],
                    'team_2_score': game["team_2_score"],
                    'is_final': game["is_final"]
                },
                'headers': {
                    'Authorization': 'bearer 3608fa9acf',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            var results = Meteor.http.post(
                "https://api.leaguevine.com/v1/game_scores/",
                requestbody,
                function (error, result) {
                    if (result) {
                        // Set the game time last updated to what LeagueVine 
                        // has (for sync purposes).
                        Games.update(
                            {id: game["id"]},
                            {$set: {scores_last_updated: result["time_last_updated"]}
                        })
                    }
                    if (error) {
                        return true
                    }
                }
            );
            return false
        }
    });

    // Sync database with LeagueVine--------------------------------------------
    SyncedCron.add({
        name: 'LeaguevineSync',
        // We sync every 10 minutes.
        schedule: function(parser) {
            return parser.text('every 2 minutes');
        },
        job: function() {
            // The tids of the tournaments we want in the database.
            var tids = [20065,20051, 20019, 19752, 19753];
            // Insert tournaments
            Meteor.call('updateTournament', tids);
            tids.forEach(function (tid) {
                // Check if the sync boolean is true, before syncing, else
                // skip that tournament.
                var tournament = Tournaments.findOne({id: tid});
                if (tournament && !tournament["sync"]) {
                    return;
                } else {
                    // Insert or update games rounds.
                    Meteor.call("updateGames", tid);

                    // Insert or update fields.
                    Meteor.call('updateFields', tid);
                }
            });
        }
    });

    SyncedCron.start();
}
