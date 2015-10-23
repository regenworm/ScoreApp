Tournaments = new Meteor.Collection('tournaments');
Games = new Meteor.Collection('games');
Fields = new Meteor.Collection('fields');

// Routes-----------------------------------------------------------------------
Router.configure( {
    layoutTemplate: 'main',
    loadingTemplate: 'loading',
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
    template: 'fieldView',
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
    }
});
Router.route('/field/:id', {
    name: 'field',
    template: 'fieldPage',
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
    }
});

if (Meteor.isClient) {
    // Helper functions---------------------------------------------------------
    // Find all tournaments
    Template.tournamentView.helpers( {
        'tournament': function() {
            return Tournaments.find({}, {sort: {name: 1}});
        }
    });

    // Count tournaments
    Template.tournamentsCount.helpers( {
        'totalTournaments': function() {
            return Tournaments.find().count();
        }
    });

    // Find all fields
    Template.fieldView.helpers( {
        'field': function() {
            return Fields.find({}, {sort: {name: 1}});
        }
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

    // Subscriptions------------------------------------------------------------
    Template.tournamentView.onCreated(function() {
        this.subscribe('tournaments');
    });

    Template.fieldView.onCreated(function() {
        this.subscribe('tournaments');
        this.subscribe('fields');
    });

    Template.fieldPage.onCreated(function() {
        this.subscribe('fields');
        this.subscribe('games');
    });
}

if (Meteor.isServer) {
    var tids = [19750, 19747, 20019];

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
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournament_teams/?tournament_ids=%5B" + tid + "%5D");
        },

        updateGames: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/games/?tournament_id=" + tid);
            results.data["objects"].forEach(function (match) {
                if (Games.find({id: match["id"]}).count() == 0) {
                    Games.insert( {
                        id:(match["id"]),
                        team_1_id:(match["team_1_id"]),
                        team_2_id:(match["team_2_id"]),
                        game_site_id:(match["game_site_id"]),
                        tournament_id:(match["tournament_id"]),
                        start:(match["start_time"])
                    });
                }
            });
        },

        updateFields: function(tid) {
            this.unblock();
            var results = Meteor.http.call("GET", "https://api.leaguevine.com/v1/game_sites/?tournament_id=" + tid);
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
        }
    });

    // Insert data which has not been inserted yet------------------------------

    tids.forEach(function (tid) {
        // Insert tournaments which are not in the db yet
        Meteor.call('updateTournament', tid);

        // Insert games rounds
        Meteor.call("updateGames", tid);

        // Insert fields
        Meteor.call('updateFields', tid);
    });
}
