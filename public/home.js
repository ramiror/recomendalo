$(document).ready(function() {
	var RView = Backbone.View.extend({
		tagName: 'li', // name of (orphan) root tag in this.el
		initialize: function(){
 			_.bindAll(this, 'render', 'unrender', 'swap', 'remove'); // every function that uses 'this' as the current object should be in here
 			
 			this.model.bind('change', this.render);
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			console.log("render");
			$(this.el).html('<span style="color:black;">'+this.model.get('part1')+' '+this.model.get('part2')+'</span> &nbsp; 				&nbsp; <span class="swap" style="font-family:sans-serif; color:blue; cursor:pointer;">[swap]</span> <span 				class="delete" style="cursor:pointer; color:red; font-family:sans-serif;">[delete]</span>');
			return this; // for chainable calls, like .render().el
    		},
    		unrender: function(){
    			console.log("unrender");
			$(this.el).remove();
		},
		swap: function(){
			console.log("swap");
			var swapped = {
				part1: this.model.get('part2'), 
				part2: this.model.get('part1')
			};
			this.model.set(swapped);
		},
		remove: function() {
			console.log("remove");
			this.model.destroy();
			console.log("after remove");
		},
		events: { 
			'click span.swap':  'swap',
			'click span.delete': 'remove'
		}
	});

	var RNView = Backbone.View.extend({
		el:$('#recommendations'),
		events: {
			'click button#add': 'addItem'
		},
		initialize: function() {
			_.bindAll(this, 'render', 'addItem', 'appendItem'); // every function that uses 'this' as the current object should be in here

			this.collection = new RList();
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

	var rview = new RNView();
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
