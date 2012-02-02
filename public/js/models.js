// esto tiene todos los modelos que se usan en la página
// cambiar esto por CoffeeScript
var host = 'http://localhost:4567/';

var Model = Backbone.Model.extend({});

var UserModel = Model.extend({});

var UserStore = Backbone.Collection.extend({
	model:UserModel, 
	url: host+'users'
});

// modelo de recomendaciones
var RModel = Model.extend({});

var RList = Backbone.Collection.extend({
	model:RModel,
	url: host+'recommendations'
});

var PageModel = Model.extend({});

var PageList = Backbone.Collection.extend({
	model: PageModel,
	url: host+'pages'
});

var FollowerList = Backbone.Collection.extend({
	model:UserModel,
	url:host+'followers'
});

var FollowingList = Backbone.Collection.extend({
	model:UserModel,
	url:host+'followeds'
});
