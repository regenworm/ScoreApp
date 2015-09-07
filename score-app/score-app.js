Tasks = new Mongo.Collection("tasks");

 
if (Meteor.isClient) {

  Template.body.events({
    "click .side-bar": function (event) {
      console.log($("#wrapper"));
      var el = $('#wrapper');
      if (!el.hasClass("open-sidebar")) {
        el.addClass('open-sidebar')
      } else {
        el.removeClass('open-sidebar')
      }

    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}
