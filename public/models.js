// esto tiene todos los modelos que se usan en la página
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

var UserStore = Backbone.Collection.extend({
	model:UserModel, 
	url: host+'users'
});

// modelo de recomendaciones
var RModel = Model.extend({
	defaults: {
		part1:'hello',
		part2:'world'
	}
});

var RList = Backbone.Collection.extend({
	model:RModel,
	url: host+'recommendations'
});
