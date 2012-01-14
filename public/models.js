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

users.add(user);

//este guarda un usuario en el server
users.create({
	username:"usuarioprueba",
	password:"unaassword"
});
