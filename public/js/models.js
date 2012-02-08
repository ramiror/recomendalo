// esto tiene todos los modelos que se usan en la página
// cambiar esto por CoffeeScript
var host = '/';

var Model = Backbone.Model.extend({});

var UserModel = Model.extend({});

var UserList = Backbone.Collection.extend({
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

var UserView = Backbone.View.extend({
	tagName: 'li', // name of (orphan) root tag in this.el
	initialize: function(opts){
		_.bindAll(this, 'render', 'unrender', 'follow', 'unfollow', 'profile'); // every function that uses 'this' as the current object should be in here
		this.model.bind('change', this.render);
		this.model.bind('remove', this.unrender);
	},
	render: function(){
		var image; 
		
		if (this.model.get('photo')) {
			image = '<img src="'+this.model.get('photo')+'" class="user-image"/>';
		} else {
			image = '<img src="" class="user-image"/>';
		}
		var html = image+'<div class="page-title"><a href="/<%= username %>"><%= fullname %></a></div> <div class="clear"></div>';
		/*if (this.options.buttons.follow) 
			html += '<span class="follow pageButton">[seguir]</span>';
		if (this.options.buttons.unfollow) 
			html += '<span class="unfollow pageButton">[dejar de seguir]</span>';*/
		
		var compiled = _.template(html);
		
		var fullname = this.model.get('fullname') || this.model.get('username');
		$(this.el).html(compiled({username:this.model.get('username'), fullname:fullname}));
		return this; // for chainable calls, like .render().el
	},
	unrender: function(){
		$(this.el).remove();
	},
	follow: function() {
		console.log("seguir");
	},
	unfollow: function() {
		console.log("dejar de seguir");
	},
	profile: function() {
		console.log("dejar de seguir");
	},
	events: {
		'click span.follow': 'follow',
		'click span.unfollow': 'unfollow'
		//TODO: agregar el ver perfil cuando el usuario clickea en la foto.
	}
});
