Tasks = new Mongo.Collection("tasks");

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

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    Meteor.call("updateTournament", function(error,results) {
        console.log(results.content);
    });
}

if (Meteor.isServer) {
    Meteor.methods({
        updateTournament: function () {
            this.unblock();
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournaments/20019/");
        }
    });
}

// Read data from server
if (true) {
    var CLIENT_ID = "04d5dc39a859c5cebd26b36a00568f";
    var CLIENT_SECRET = "54bd6343cd051bb322aed42c19d090";
}

