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
    console.log("hoi1");
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
            var username = $('[name=username]').val();
            var password = $('[name=password]').val();
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
            window.alert(username);
            Router.go('/register');
            $('[name=username]').val(username);
            $('[name=password]').val(password);
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}

// Read data from server
if (true) {
    // var org_id = ;
    // var sport = ;
    // var ACCESS_TOKEN = ;
    var CLIENT_ID = "04d5dc39a859c5cebd26b36a00568f";
    var CLIENT_SECRET = "54bd6343cd051bb322aed42c19d090";
}
// https://www.leaguevine.com/oauth2/token/?client_id=04d5dc39a859c5cebd26b36a00568f
//     &client_secret=54bd6343cd051bb322aed42c19d090
//     &grant_type=client_credentials
//     &scope=universal

// https://www.leaguevine.com/oauth2/token/?client_id=04d5dc39a859c5cebd26b36a00568f
//     &response_type=code
//     &redirect_uri=YOUR_REGISTERED_REDIRECT_URI
//     &scope=universal

// https://www.leaguevine.com/oauth2/token/?client_id=YOUR_CLIENT_ID
//     &client_secret=CLIENT_SECRET
//     &grant_type=client_credentials
//     &scope=universal

// $(function() {
//     $.ajax({
//         url: "https://api.leaguevine.com/v1/leagues/?" + 
//              "organization_id=2" + 
//              "&sport=ultimate" +
//              "&access_token=ACCESS_TOKEN",
//         dataType: "json",
//         contentType: "application/json",
//         beforeSend: function(jqXHR, settings) {
//             settings.accepts['json'] = "application/json";
//         },
//         success: function(data){
//             for (i=0; i < data.objects.length; i++) {  
//                 var obj = data.objects[i];
//                 // Do something with the objects
//             }
//         },
//     });
// });
