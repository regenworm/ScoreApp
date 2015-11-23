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
        var curren_field = parseInt(this.params["id"]);
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
// Later verwijderen
Router.route('/database', {
    name: 'database',
    template: 'database'
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

    // Find the parsed time of a game
    Template.gameView.helpers({
        'parsed_time': function() {
            return moment(this['start_time']).format('Do MMMM, h:mm a');
        },
        'select_color': function(col1, col2) {
            if (col1) {
                $('#colorpicker1').val(col1);
            }
            if (col2) {
                $('#colorpicker2').val(col2);
            }
        },
        'gpsSet': function() {
            return Session.get("cur_pos");
        },
        'leftGame': function() {
            var field = Fields.findOne({id: this.game_site_id});
            if(!field) {
                return;
            }
            var games = field["games"];
            console.log(games);
        },
        'rightGame': function() {
            console.log(this);
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

    // Later verwijderen
    Template.database.helpers({
        Fields: function() {
            return Fields;
        },
        Games: function() {
            return Games;
        },
        Tournaments: function() {
            return Tournaments;
        }
    });
    Template.database.events({
        'click .reactive-table tbody tr': function(event) {
            var field = this;
            console.log(this);
        }
    });

    // Event functions----------------------------------------------------------
    Template.main.events({
        // set gps location
        'click #gps': function() {
            Location.locate(function(pos){
                Session.setAuth("cur_pos", pos);
            },  function(err){
                console.log("Oops! There was an error", err);
            });
        },
    });

    Template.fieldView.events({
        'click .reactive-table tbody tr': function(event) {
            var field = this;
            Router.go('field_games', this);
        }
    });

    // Sidebar toggle
    var slideout;
    Template.main.events({
        'click #toggle': function (e) {
            slideout.toggle();
        }
    });

    // When a user logs out
    Template.menuItems.events( {
        'click .logout': function(event) {
            event.preventDefault();
            Meteor.logout();
            Router.go('login');
        }
    });

    // When the user clicks on a menu entry, show/hide
    Template.menuTournament.events( {
        'click .tournament': function() {
            $(event.target).siblings().slideToggle();
        },
        'click .field': function() {
            $(event.target).siblings().slideToggle();
        }
    });

    Template.gameView.events({
        'click #nextGame': function() {
            var current_game = this;
            current_field = Fields.findOne({id: current_game["game_site_id"]});
            game_index = current_field["games"].indexOf(current_game["id"]);
            if (game_index+1 < current_field["games"].length) {
                game_index = current_field["games"][game_index+1]
                path = '/game/'+game_index + '/';
                Router.go(path);
            } else {
                window.alert("This is the last game on this field.");
            }
        },
        'click #prevGame': function() {
            var current_game = this;
            current_field = Fields.findOne({id: current_game["game_site_id"]});
            game_index = current_field["games"].indexOf(current_game["id"]);
            if (game_index > 0) {
                game_index = current_field["games"][game_index-1]
                path = '/game/'+game_index + '/';
                Router.go(path);
            } else {
                window.alert("This is the first game on this field.");
            }
        },

        // set field gps to current location
        'click #setGps': function() {
            var current_game = this;
            var pos = Session.get("cur_pos");
            var current_field = Fields.findOne({id: current_game["game_site_id"]});
            Fields.update({_id: current_field["_id"]}, {$set: {location: pos}});
        },
        'click #team_1_plus': function () {
            var current_game = this;
            Games.update({_id: current_game['_id']}, {
                $inc: {
                    team_1_score: 1
                }
            }); 
            Games.update(
                {_id: current_game['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team1+'
                    }
                }
            });
        },
        'click #team_2_plus': function () {
            var current_game = this;
            Games.update({_id: current_game['_id']}, {
                $inc: {
                    team_2_score: 1
                }
            }); 
            Games.update(
                {_id: current_game['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team2+'
                    }
                }
            });
        },
        'click #team_1_minus': function () {
            var current_game = this;
            Games.update({_id: current_game['_id']}, {
                $inc: {
                    team_1_score: -1
                }
            }); 
            Games.update(
                {_id: currentGame['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team1-'
                    }
                }
            });
        },
        'click #team_2_minus': function () {
            var current_game = this;
            Games.update({_id: current_game['_id']}, {
                $inc: {
                    team_2_score: -1
                }
            }); 
            Games.update(
                {_id: current_game['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team2-'
                    }
                }
            });
        },

        // update teamcolors for all games that are after
        // the current game
        'click #colorpicker1': function () {
            current_game = this;
            color = $('#colorpicker1').val();
            Games.find({team_1_id: this["team_1_id"]}).forEach(function (post) {
                if (moment(current_game.start_time).isAfter(post.start_time) || current_game._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_1_col: color
                        }
                    })
                }            
            });
            Games.find({team_2_id: this["team_1_id"]}).forEach(function (post) {
                if (moment(current_game.start_time).isAfter(post.start_time) || current_game._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_2_col: color
                        }
                    })
                }           
            });
        },
        'click #colorpicker2': function () {
            current_game = this;
            color = $('#colorpicker2').val();
            Games.find({team_1_id: this["team_2_id"]}).forEach(function (post) {
                if (moment(current_game.start_time).isAfter(post.start_time) || current_game._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_1_col: color
                        }
                    })
                }             
            });
            
            Games.find({team_2_id: this["team_2_id"]}).forEach(function (post) {
                if (moment(current_game.start_time).isAfter(post.start_time) || current_game._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_2_col: color
                        }
                    })
                }             
            });
        },
        'click #isFinal': function () {
            event.preventDefault();
            $("div.overlay").fadeToggle("fast");
        }
    });

    // onRendered functions-----------------------------------------------------
    // Sidebar instance initialisation
    Template.main.onRendered(function () {
        var template = this;
        slideout = new Slideout({
            'panel': template.$('#content').get(0),
            'menu': template.$('#slideout-menu').get(0),
            'padding': 600,
            'tolerance': 70
        });
    });


    // Login, register and logout-----------------------------------------------
    // Default messages for errors for login and register
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

    // Login prevent
    Template.loginPage.events( {
        'submit form': function(event) {
            event.preventDefault();
        }
    });
    // Validate login
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

    // Register prevent
    Template.registerPage.events( {
        'submit form': function() {
            event.preventDefault();
        }
    });
    // Validate register
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
                        console.log(error.reason);
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
    // easy db reset
    if(true) {
        Games.remove({});
        Tournaments.remove({});
        Fields.remove({});
    }


    // Publishions--------------------------------------------------------------
    // Meteor.publish('tournaments', function() {
    //     return Tournaments.find();
    // });

    // Meteor.publish('games', function() {
    //     return Games.find();
    // });

    // Meteor.publish('fields', function() {
    //     return Fields.find();
    // });

    // Methodes-----------------------------------------------------------------
    Meteor.methods( {
        updateTournament: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournaments/" + tid + "/");
            if (Tournaments.find({id: results.data["id"]}).count() == 0) {
                Tournaments.insert({
                    id: results.data["id"], name: results.data["name"]
                });
            }
        },

        updateTeams: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournament_teams/?tournament_ids=%5B" + tid + "%5D");
            results.data["objects"].forEach(function (team) {
                if (Games.find({id: team["id"]}).count() == 0) {
                    Games.insert( {
                        id: team["id"],
                        name: team["team"]["name"],
                        team_2_id: match["team_2_id"],
                        game_site_id: match["game_site_id"],
                        tournament_id: match["tournament_id"],
                        start: match["start_time"]
                    });
                }
            });
        },

        // score elke minuut checken op leaguevine
        // refresh triggeren als iemand op gamepagina zit
        // aan de id van een object kijken hoe oud het is
        updateGames: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/games/?tournament_id=" + tid);
            while (true) {
                results.data["objects"].some(function (match) {
                    if (match["team_1_id"] === null || match["team_2_id"] === null || typeof(match["team_1_id"]) === undefined || typeof(match["team_2_id"]) === undefined) {
                        return false;
                    }

                    var score_final = Meteor.http.call("GET", "https://api.leaguevine.com/v1/game_scores/?game_id="+match["id"]);
                    console.log(match["id"]);
                    console.log(score_final["objects"]);
                    console.log(score_final["meta"]);

                    if (Games.find({id: match["id"]}).count() == 0) {
                        currentgame = {
                            id: match["id"],
                            team_1_id: match["team_1_id"],
                            team_1_name: match["team_1"]["name"],
                            team_1_score: match["team_1_score"],
                            team_1_col: "#fff",
                            team_2_id: match["team_2_id"],
                            team_2_name: match["team_2"]["name"],
                            team_2_score: match["team_2_score"],
                            team_2_col: "#fff",
                            game_site_id: match["game_site_id"],
                            tournament_id: match["tournament_id"],
                            start_time: Date.parse(match["start_time"]),
                            // is_final: score_final[0]["is_final"],
                            history: []
                        };
                        Games.insert(currentgame);
                    }
                });
                if (results.data["meta"]["next"] === null) {
                    break;
                }
                results = Meteor.http.call("GET", results.data["meta"]["next"]);
            }
        },

        updateFields: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/game_sites/?tournament_id=" + tid);

            while (true) {
                results.data["objects"].forEach(function (event_site) {
                    var cur_id = event_site["id"];
                    if(Fields.find({id: cur_id}).count() == 0) {
                        var related_tournaments = [];
                        Games.find({game_site_id: cur_id}).forEach(function (game) {
                            related_tournaments.push(game["tournament_id"]);
                        });


                        var related_games = [];
                        Games.find({game_site_id: cur_id}).forEach(function (game) {
                            related_games.push(game["id"]);
                        });

                        var related_field = null;
                        var cur_name = event_site["name"];
                        var field = Fields.findOne({name: cur_name});
                        if(field) {
                            related_field = field["id"];
                        }
                        Fields.insert({
                            id: cur_id,
                            name: cur_name,
                            location: event_site["event_site"]["description"],
                            tournament_id: related_tournaments,
                            games: related_games,
                            related_field: related_field
                        });
                    }
                });
                if (results.data["meta"]["next"] === null) {
                    break;
                } 
                results = Meteor.http.call("GET", results.data["meta"]["next"]);
            }
        },

        getToken: function() {
            client_id = "04d5dc39a859c5cebd26b36a00568f";
            client_secret = "54bd6343cd051bb322aed42c19d090";

            var results = Meteor.http.call("GET", "https://www.leaguevine.com/oauth2/token/?client_id=" + client_id +
                                                    "&client_secret=" + client_secret +
                                                    "&grant_type=client_credentials&scope=universal");

            Session.setPersistent("tokens", results["acces_token"]);
        },

        updateScore: function(game) {
            var requestbody = {
                game_id: game["id"],
                team_1_id: match["team_1_id"],
                team_2_id: match["team_2_id"],
                team_1_score: game["team_1_score"],
                team_2_score: game["team_1_score"],
                is_final: game["is_final"]
            };

            var tokens = Session.get("tokens");

            var results  = Meteor.http.call("POST", "https://api.leaguevine.com/v1/game_scores/");
        }
    });

    // Insert data which has not been inserted yet------------------------------
    var tids = [20051, 20019, 19750, 19747];
    if(true) {
        tids.forEach(function (tid) {
            // Insert tournaments which are not in the db yet
            Meteor.call('updateTournament', tid);

            // Insert games rounds
            Meteor.call("updateGames", tid);

            // Insert fields
            Meteor.call('updateFields', tid);
        });
    }
}
