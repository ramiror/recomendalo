var recommendationData;

$(document).ready(function() {
	var RView = Backbone.View.extend({
		tagName: 'li', // name of (orphan) root tag in this.el
		initialize: function(){
 			_.bindAll(this, 'render', 'unrender', 'remove','alreadyseen', 'viewlater'); // every function that uses 'this' as the current object should be in here
 			
 			this.model.bind('change', this.render);
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			var compiled = _.template('<span style="color:black;"><%= title %></span>  &nbsp;<span class="viewlater" style="cursor:pointer; color:red; font-family:sans-serif;">[ver mas tarde]</span> &nbsp;<span class="alreadyseen" style="cursor:pointer; color:red; font-family:sans-serif;">[ya lo vi]</span> &nbsp;<span class="delete" style="cursor:pointer; color:red; font-family:sans-serif;">[botar]</span>');
			$(this.el).html(compiled({title:this.model.get('obj').title}));
			return this; // for chainable calls, like .render().el
    		},
    		unrender: function(){
			$(this.el).remove();
		},
		alreadyseen: function() {
			this.model.save({state:ALREADY_SEEN});
		},
		viewlater: function() {
			this.model.save({state:QUEUED});
		},		
		remove: function() {
			this.model.save({state:DUMPED});
		},
		events: {
			'click span.delete': 'remove',
			'click span.viewlater': 'viewlater',
			'click span.alreadyseen': 'alreadyseen'
		}
	});

	var RNView = Backbone.View.extend({
		el:$('#recommendations'),
		events: {
			'click button#add': 'addItem'
		},
		initialize: function(opts) {
			_.bindAll(this, 'render', 'addItem', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new RList();
			}
			this.collection.bind('add', this.appendItem); // collection event binder	      
			
			this.counter = 0; // total number of items added thus far
			this.render();
		},

		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			$(this.el).append("<button id='add'>Add list item</button>");
			$(this.el).append("<ul></ul>");
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},

		//addItem(): Custom function called via click event above.
		addItem: function(){
			this.counter++;
			var item = new RModel();
			item.set({
				part2: item.get('part2') + this.counter // modify item defaults
			});
			this.collection.add(item); // add item to collection; view is updated via event 'add'
		},
		
		appendItem: function(item){
			var itemView = new RView({
				model: item
			});
			$('ul', this.el).append(itemView.render().el);
    		}
	});

	var recommendations = new RList();
	recommendations.reset(recommendationData);
	var rview = new RNView({
		collection: recommendations
	});
});

function showRecommendations(recommendations) {
/*	$.each(recommendations.models, function(index, model) {
		var view = new RView({
			model: model,
			id: "rview-"+model.id
		});
		console.log(view.el);
		$('.recommendations').append(view.el);
		view.render();
	});*/
}
