if (Meteor.isClient) {
  
}

if (Meteor.isServer) {
  Meteor.methods({
        updateTournament: function () {
            this.unblock();
            return Meteor.http.call("GET", "https://api.leaguevine.com/v1/tournaments/" + tid + "/");
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
}
