var Tournaments = new Meteor.Collection('tournaments');
var Games = new Meteor.Collection('games');
var Fields = new Meteor.Collection('fields');

// Routes-----------------------------------------------------------------------
// Ignore links with skipIr
Router.configure( {
    layoutTemplate: 'main',
    loadingTemplate: 'loading',
    linkSelector: 'a[href], a:not([skipir])'
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
        return [Meteor.subscribe('tournaments'), 
                Meteor.subscribe('fields'),
                Meteor.subscribe('games')];
    }
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
Router.route('/tournament/:id', {
    name: 'tournament',
    template: 'fieldsView',
    data: function() {
        var currentTournament = parseInt(this.params["id"]);
        return Tournaments.findOne({id: currentTournament});
    },
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
        var currentTournament = parseInt(this.params["id"]);
        return [Meteor.subscribe('tournaments'), 
            Meteor.subscribe('fields', currentTournament)]
    }
});
Router.route('/field/:id', {
    name: 'field',
    template: 'gamesView',
    data: function() {
        var currentField = parseInt(this.params["id"]);
        return Fields.findOne({id: currentField});
    },
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
        var currentField = parseInt(this.params["id"]);
        return [Meteor.subscribe('fields', ""),
            Meteor.subscribe('games', currentField, "")]
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
    },
    waitOn: function() {
        var currentGame = parseInt(this.params["id"]);
        return Meteor.subscribe('games', "", currentGame)
    }
});

// Auto-close the sidebar on route stop (when navigating to a new route)
// Router.onStop(function () {
//     if (slideout) {
//       slideout.close();
//     }
// });

if (Meteor.isClient) {
    // Helper functions---------------------------------------------------------
    // Find all tournaments
    Template.tournamentView.helpers( {
        'tournament': function() {
            return Tournaments.find({}, {sort: {name: 1}});
        }
    });

    // Find all tournaments
    Template.menuItems.helpers( {
        'tournament': function() {
            return Tournaments.find({}, {sort: {name: 1}});
        }
    });

    // ------------------------------------------
    //  werkt nog niet
    // Find all fields related to tournaments
    Template.menuTournament.helpers( {
        'field': function () {
            return Fields.find({tournament_id: this.id});
        }
    });

    Template.menuTournament.events( {
        'click .parent': function() {
            $('.sub-nav').slideToggle();
        }
        'click .parent2': function() {
            $('.sub-nav2').slideToggle();
        }
    })


    // Count tournaments
    Template.tournamentsCount.helpers( {
        'totalTournaments': function() {
            return Tournaments.find().count();
        }
    });

    // Find all fields
    Template.fieldsView.helpers( {
        'field': function() {
            return Fields.find({}, {sort: {name: 1}});
        }
    });

    // Find all games
    Template.gamesView.helpers( {
        'game': function() {
            return Games.find({}, {sort: {name: 1}});
        }
    });

    // Sidebar------------------------------------------------------------------
    var slideout;
    // Sidebar toggle
    Template.main.events({
        'click #toggle': function (e) {
            slideout.toggle();
        }
    });

    // Sidebar instance initialisation
    Template.main.onRendered(function () {
        var template = this;
        slideout = new Slideout({
            'panel': template.$('#content').get(0),
            'menu': template.$('#slideout-menu').get(0),
            'padding': 256,
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

    // Logout
    Template.navigation.events( {
        'click .logout': function(event) {
            event.preventDefault();
            Meteor.logout();
            Router.go('login');
        }
    });
}

if (Meteor.isServer) {
    // easy db reset
    if (true) {
        Games.remove({});
        Tournaments.remove({});
        Fields.remove({});
    }


    // Publishions--------------------------------------------------------------
    Meteor.publish('tournaments', function() {
        return Tournaments.find();
    });

    Meteor.publish('games', function(currentField, currentGame) {
        if (currentField != "") {
            return Games.find({game_site_id: currentField});
        }
        else if (currentGame != "") {
            return Games.find({id: currentGame});
        }
        else {
            return Games.find();
        }
    });

    Meteor.publish('fields', function(currentTournament) {
        if (currentTournament == "") {
            return Fields.find();
        }
        else {
            return Fields.find({tournament_id: currentTournament});
        }
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
                results.data["objects"].forEach(function (match) {
                    if (Games.find({id: match["id"]}).count() == 0) {
                        var team1temp = Meteor.http.call("GET", "https://api.leaguevine.com/v1/teams/?team_ids=%5B"+ match["team_1_id"]+ "%5D");
                        // var team2 = Meteor.http.call("GET", "https://api.leaguevine.com/v1/teams/"+ match["team_2_id"])["name"];
                        currentgame = {
                            id: null,
                            team_1_id: null,
                            team_1_name: null,
                            team_1_score: null,
                            team_2_id: null,
                            team_2_name: null,
                            team_2_score: null,
                            game_site_id: null,
                            tournament_id: null,
                            start: null
                        }
                        values = ["id","team_1_id","team_1_score","team_2_id","team_2_name","team_2_score","game_site_id","tournament_id","start"];
                        // if important values are uninitialised, set to onbekend
                        for (i=0; i < values.length; i++){
                            var value = match[values[i]];
                            if ((value !== null) && (typeof(value) !== "undefined")) {
                                currentgame[values[i]] = value;
                            }
                            else {
                                currentgame[values[i]] = "Onbekend";
                            }
                        }
                        var team_1_name = match["team_1"]["name"];
                        if ((team_1_name !== null) && (typeof(team_1_name) !== "undefined")) {
                            currentgame["team_1_name"] = team_1_name;
                        }
                        else {
                            currentgame["team_1_name"] = "Onbekend";
                        }
                        var team_2_name = match["team_2"]["name"];
                        if ((team_2_name !== null) && (typeof(team_2_name) !== "undefined")) {
                            currentgame["team_2_name"] = team_2_name;
                        }
                        else {
                            currentgame["team_2_name"] = "Onbekend";
                        }

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
                        Fields.insert({
                            id: event_site["id"],
                            name: event_site["name"],
                            location: event_site["event_site"]["description"],
                            tournament_id: related_tournaments
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
    var tids = [20019];//19750, 19747, 20019];
    tids.forEach(function (tid) {
        // Insert tournaments which are not in the db yet
        Meteor.call('updateTournament', tid);

        // Insert games rounds
        Meteor.call("updateGames", tid);

        // Insert fields
        Meteor.call('updateFields', tid);
    });
}
