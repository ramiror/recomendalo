$(document).ready(function() {
	var UsersView = Backbone.View.extend({
		el:$('#users'),
		initialize: function(opts) {
			_.bindAll(this, 'render', 'load', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new UserList();
			}
			
			this.collection.bind('add', this.appendItem); // collection event bind
			this.render();
		},
		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			$(this.el).html(''); //borramos datos del elemento, si los hubiera
			
			$(this.el).append("<ul></ul>");
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		appendItem: function(item){
			var userView = new UserView({
				model: item,
				buttons:{
					follow:false,
					unfollow:false
				}
			});
			$('ul', this.el).append(userView.render().el);
		},
		load: function() {
			var self = this;
			$.getJSON('/users', function(data) {
				self.collection.reset(data);
				self.render();	
			});
		},
		events: {}
	});
	
	// inicialización
	var users = new UserList();
	var uview = new UsersView({
		collection: users
	});
	uview.load();
});
