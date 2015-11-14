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
        var currentUser = Meteor.userId();
        if (currentUser) {
            this.next();
        }
        else {
            Router.go('login');
        }
    },
    waitOn: function() {
        console.log("asd");
        return [Meteor.subscribe('tournaments'), 
                Meteor.subscribe('fields'),
                Meteor.subscribe('games')];
    }
});
Router.route('/field_overview', {
    name: 'field_overview',
    template: 'fieldView',
    onBeforeAction: function() {
        var currentUser = Meteor.userId();
        if (currentUser) {
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
        var currentUser = Meteor.userId();
        if (currentUser) {
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
        var currentUser = Meteor.userId();
        if (currentUser) {
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
        var currentGame = parseInt(this.params["id"]);
        return Games.findOne({id: currentGame});
    },
    onBeforeAction: function() {
        var currentUser = Meteor.userId();
        if (currentUser) {
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
        }
    });

    // Find all the fields
    Template.fieldView.helpers({
        settings: function() {
            return {
                collection: Fields,
                showNavigation: 'always',
                fields: [
                    {key: 'name', label: 'Name'}, 
                    {key: 'location', label: 'Location'
                    // ,fn: function (value, object) {return value}
                    // voor de locatie berekening
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

    // Event functions----------------------------------------------------------
    Template.fieldView.events({
        'click .reactive-table tbody tr': function(event) {
            var field = this;
            console.log(field);
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
        // get gps location
        'click #gps': function() {
            console.log("message");
            Location.locate(function(pos){
               console.log("Got a position!", pos);
            }, function(err){
               console.log("Oops! There was an error", err);
            });
        },
        // set field gps to current location
        'click #setGps': function() {
            var currentGame = this;
            Location.locate(function(pos){
                var currentField = Fields.findOne({id: currentGame["game_site_id"]});
                Fields.update({_id: currentField["_id"]}, {$set: {location: pos}});
            }, function(err){
                console.log("Oops! There was an error", err);
            });
        },
        'click #team_1_plus': function () {
            var currentGame = this;
            Games.update({_id: currentGame['_id']}, {
                $inc: {
                    team_1_score: 1
                }
            }); 
            Games.update(
                {_id: currentGame['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team1+'
                    }
                }
            });
        },
        'click #team_2_plus': function () {
            var currentGame = this;
            Games.update({_id: currentGame['_id']}, {
                $inc: {
                    team_2_score: 1
                }
            }); 
            Games.update(
                {_id: currentGame['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team2+'
                    }
                }
            });
        },
        'click #team_1_minus': function () {
            var currentGame = this;
            Games.update({_id: currentGame['_id']}, {
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
            var currentGame = this;
            Games.update({_id: currentGame['_id']}, {
                $inc: {
                    team_2_score: -1
                }
            }); 
            Games.update(
                {_id: currentGame['_id']}, {
                $push: {
                    history: {
                        user: Meteor.userId(), 
                        type:'team2-'
                    }
                }
            });
        },

        // update teamcolors
        'click #colorpicker1': function () {
            currentGame = this;
            color = $('#colorpicker1').val();
            Games.find({team_1_id: this["team_1_id"]}).forEach(function (post) {
                if (moment(currentGame.start_time).isAfter(post.start_time) || currentGame._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_1_col: color
                        }
                    })
                }            
            });
            Games.find({team_2_id: this["team_1_id"]}).forEach(function (post) {
                if (moment(currentGame.start_time).isAfter(post.start_time) || currentGame._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_2_col: color
                        }
                    })
                }           
            });
            // Games.find({team_2_id: this["team_1_id"]}).forEach(function (post) {
            //     Games.update({_id: post._id}, {team_2_col: color});            
            // });

        },
        'click #colorpicker2': function () {
            currentGame = this;
            color = $('#colorpicker2').val();
            Games.find({team_1_id: this["team_2_id"]}).forEach(function (post) {
                if (moment(currentGame.start_time).isAfter(post.start_time) || currentGame._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_1_col: color
                        }
                    })
                }             
            });
            
            Games.find({team_2_id: this["team_2_id"]}).forEach(function (post) {
                if (moment(currentGame.start_time).isAfter(post.start_time) || currentGame._id == post._id) {
                    Games.update({_id: post._id}, {
                        $set: {
                            team_2_col: color
                        }
                    })
                }             
            });
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

if (Meteor.isServer) {
    // easy db reset
    if (false) {
        Games.remove({});
        Tournaments.remove({});
        Fields.remove({});
    }


    // Publishions--------------------------------------------------------------
    Meteor.publish('tournaments', function() {
        return Tournaments.find();
    });

    Meteor.publish('games', function() {
        return Games.find();
    });

    Meteor.publish('fields', function() {
        return Fields.find();
    });

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
                            start_time: match["start_time"],
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
                    if(Fields.find({id: event_site["id"]}).count() == 0) {
                        var related_tournaments = [];
                        Games.find({game_site_id: event_site["id"]}).forEach(function (game) {
                            related_tournaments.push(game["tournament_id"]);
                        });
                        var related_games = [];
                        Games.find({game_site_id: event_site["id"]}).forEach(function (game) {
                            related_games.push(game["id"]);
                        });
                        Fields.insert({
                            id: event_site["id"],
                            name: event_site["name"],
                            location: event_site["event_site"]["description"],
                            tournament_id: related_tournaments,
                            games: related_games
                        });
                    }
                });
                if (results.data["meta"]["next"] === null) {
                    break;
                } 
                results = Meteor.http.call("GET", results.data["meta"]["next"]);
            }
        }
    });

    // Insert data which has not been inserted yet------------------------------
    var tids = [20019, 19750, 19747];
    if (false) {
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
