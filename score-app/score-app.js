Tournaments = new Mongo.Collection("tournaments");

// routing
Router.route('/', {
    name: 'home',
    template: 'home'
});

Router.route('/register', {
    name: 'register',
    template: 'register'
});

Router.route('/tournament-1', {
    name: 'tournament-1',
    template: 'field_view'
});
// temp = Tournaments.find();
// for (i=0; i < 1; i++) {
//     console.log("hoi");
//     Router.route('/20019', {
//         name: "hoi",
//         template: 'field_view'
//     });
// }
Tournaments.find().forEach(function(tournament) { 
    Router.route('/20019', {
        name: toString(tournament.id),
        template: 'field_view'
    });
});

// // routes
// Tournaments.find().forEach(function (entry) {
//     console.log('/'+entry.id.toString());
//     Router.route('/20019/', {
//         name: "bla",
//         template: 'field_view'
//     });
//     i++; 
//  });


// client side code
if (Meteor.isClient) {
    // toggle sidebar
    Template.menu.events({
        "click #sidebar-toggle": function (e) {
            e.preventDefault();
            var el = $('#wrapper');
            if (!el.hasClass("open-sidebar")) {
                el.addClass('open-sidebar')
            } else {
                el.removeClass('open-sidebar')
            }

        },

        "click #backbutton": function (e) {
            e.preventDefault();
            Router.go('home');
        }
    });

    // if submit button of a form in register template is pressed
    // create user account
    Template.register.events({
        'submit form': function(e) {
            e.preventDefault();
            var username = $('[name=usernamer]').val();
            var password = $('[name=passwordr]').val();
            Accounts.createUser({
                username: username,
                password: password
            }, function (error) {
                // if errors, return reason else go home
                if (error) {
                    console.log(error.reason);
                    window.alert(error.reason);
                } else {
                    Router.go('home');
                }
            });
        }
    });

    // log out button in the sidebar
    Template.sidebar.events({
        'click .logout': function(e) {
            e.preventDefault();
            Meteor.logout();
            Router.go('login');
        }
    });

    // log in page
    Template.login.events({
        'submit form': function(e) {
            e.preventDefault();
            var username = $('[name=username]').val();
            var password = $('[name=password]').val();
            Meteor.loginWithPassword(username,password,function(err) {
                // if errors, return reason else go home
                if (error) {
                    console.log(error.reason);
                    window.alert(error.reason);
                } else {
                    Router.go('home');
                }
            });
        },

        // refer to registration
        // fill in user info
        'click button': function(e) {
            e.preventDefault();
            var username = $('[name=username]').val();
            var password = $('[name=password]').val();
            Router.go('/register');
            $('[name=username]').val(username);
            $('[name=password]').val(password);
        }
    });

    // when creating an account no email necessary
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    Template.tournament_view.helpers({
        tournaments: function () {
            return Tournaments.find({});
        }
    });

    //  update tournaments
    Meteor.call("updateTournament", function(error,results) {

        if (Tournaments.find({id: results.data["id"]}).count()==0)
        {
            Tournaments.insert(
                { name: results.data["name"], id: results.data["id"]}
            );
        }

    });

    // update swiss rounds
    Meteor.call("updateSwiss", function(error,results) {
        var out = results.data.objects[0].games;
        // console.log(out);
    });
}

if (Meteor.isServer) {
    var tid = 20019;
    Meteor.methods({
        updateTournament: function () {
            this.unblock();
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournaments/" + tid + "/");
        },

        updateTeams: function () {
            this.unblock();
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournament_teams/?tournament_ids=%5B" + tid + "%5D");
        },
        updateSwiss: function () {
            this.unblock();
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/swiss_rounds/?tournament_id=" + tid);
        }
    });

    // Tournaments.remove({});
}



