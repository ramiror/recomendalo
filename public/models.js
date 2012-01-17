// cambiar esto por CoffeeScript
var host = 'http://localhost:4567/';

var Model = Backbone.Model.extend({
	initialize: function() {
	}
});

var UserModel = Model.extend({
	alertar: function() {
		alert("alertando");
	}
});

var user = new UserModel();

var UserStore = Backbone.Collection.extend({
	model:UserModel, 
	url: host+'users'
});

var users = new UserStore();

var RecommendationStore = Backbone.Collection.extend({
	model:UserModel, 
	url: host+'recommendations'
});

var recommendations = new RecommendationStore();
