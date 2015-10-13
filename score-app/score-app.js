Tournaments = new Meteor.Collection('tournaments');

// Routes-----------------------------------------------------------------------
Router.configure( {
    layoutTemplate: 'main',
    loadingTemplate: 'loading'
})
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
    template: 'tournamentPage',
    data: function() {
        // Soms moet het met parseInt worden gedaan om onbekende redenen
        // Later testen met echte data om te kijken of het nog steeds voorkomt.
        var currentTournament = this.params["id"];
        var returnValue = Tournaments.findOne({id: currentTournament});
        if (returnValue) {
            return returnValue;
        }
        else {
            return Tournaments.findOne({id: parseInt(currentTournament)});
        }
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

    // mag later weg
    Template.addTournament.events( {
        'submit form': function(event) {
            event.preventDefault();
            var tournamentName = $('[name=tournamentName]').val();
            Meteor.call('createNewTournament', tournamentName);
            $('[name=tournamentName]').val('');
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

    Template.tournamentPage.onCreated(function() {
        this.subscribe('tournaments');
    });
}

if (Meteor.isServer) {
    // Publishions--------------------------------------------------------------
    Meteor.publish('tournaments', function() {
        return Tournaments.find()
    });

    // Methodes-----------------------------------------------------------------
    Meteor.methods( {
        // Mag later weg
        'createNewTournament': function(tournamentName) {
            var currentUser = Meteor.userId();
            if (!currentUser) {
                throw new Meteor.Error("not-logged-in", "You're not logged in.");
            }
            check(tournamentName, String);
            if (tournamentName =="") {
                listname = "Untitled";
            }
            var data = {
                name: tournamentName, 
                id: Math.floor(Math.random() * 10000) + 1
            };
            Tournaments.insert(data);
        }
    });
}
