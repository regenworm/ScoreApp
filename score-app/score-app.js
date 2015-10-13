Tournaments = new Meteor.Collection('tournaments');

// Routes
Router.configure({
    layoutTemplate: 'main'
})
Router.route('/', {
    name: 'home',
    template: 'homePage'
});
Router.route('/register', {
    template: 'registerPage'
});
Router.route('/login', {
    template: 'loginPage'
});
Router.route('/tournament/:id', {
    name: 'tournamentPage',
    template: 'tournamentPage',
    data: function(){
        // Soms moet het met parseInt worden gedaan om onbekende redenen
        // Later testen met echte data om te kijken of het nog steeds voorkomt.
        var currentTournament = this.params["id"];
        var returnValue = Tournaments.findOne({id: currentTournament});
        if (returnValue) {
            return returnValue
        }
        else {
            return Tournaments.findOne({id: parseInt(currentTournament)});
        }
    }
});

if (Meteor.isClient) {
    // Find all tournaments
    Template.tournamentView.helpers({
        'tournament': function(){
            return Tournaments.find({}, {sort: {name: 1}});
        }
    })

    // Count tournaments
    Template.tournamentsCount.helpers({
        'totalTournaments': function(){
            return Tournaments.find().count();
        }
    })

    // mag later weg
    Template.addTournament.events({
        'submit form': function(event){
            event.preventDefault();
            var tournamentName = $('[name=tournamentName]').val()
            Tournaments.insert({name: tournamentName, 
                id: Math.floor(Math.random() * 10000) + 1}, 
                function(error, results){
                    Router.go('tournamentPage', {_id: results});
            });
            $('[name=tournamentName]').val('');
        }
    })
}

if (Meteor.isServer) {

}
