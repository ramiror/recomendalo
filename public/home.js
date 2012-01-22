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
			var compiled = _.template('<div style="color:black;"><%= title %></div> <div><%= desc %></div> <div class="clear"></div> &nbsp;<span class="viewlater" style="cursor:pointer; color:red; font-family:sans-serif;">[ver mas tarde]</span> &nbsp;<span class="alreadyseen" style="cursor:pointer; color:red; font-family:sans-serif;">[ya lo vi]</span> &nbsp;<span class="delete" style="cursor:pointer; color:red; font-family:sans-serif;">[botar]</span>');
			$(this.el).html(compiled({title:this.model.get('obj').title, desc: this.model.get('obj').description}));
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
			_.bindAll(this, 'render', 'addItem', 'selectNew', 'selectQueued', 'selectSeen', 'selectDumped', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new RList();
			}
			
			//this.collection.bind('add', this.appendItem); // collection event binder	      
			
			this.counter = 0; // total number of items added thus far
			this.render();
		},

		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			$(this.el).html(''); //borramos datos del elemento, si los hubiera
			
			//$(this.el).append("<button id='add'>Add list item</button>");
			$(this.el).append("<button class='new'>Nuevas</button>");
			$(this.el).append("<button class='queued'>Encoladas</button>");
			$(this.el).append("<button class='seen'>Vistas</button>");
			$(this.el).append("<button class='dumped'>Descartadas</button>");
			
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
    		},
    		selectNew: function() {
    			var self = this;
			$.getJSON('/recommendations/new', function(data) {
				self.collection.reset(data);
				self.render();	
			});
    		},
    		selectQueued: function() {
    			var self = this;
			$.getJSON('/recommendations/queued', function(data) {
				self.collection.reset(data);
				self.render();	
			});
    		},
    		selectSeen: function() {
    			var self = this;
			$.getJSON('/recommendations/already_seen', function(data) {
				self.collection.reset(data);
				self.render();	
			});
    		},
    		selectDumped: function() {
    			var self = this;
			$.getJSON('/recommendations/dumped', function(data) {
				console.log(data);
				self.collection.reset(data);
				self.render();	
			});
    		},
		events: {
			'click button.new': 'selectNew',
			'click button.seen': 'selectSeen',
			'click button.queued': 'selectQueued',
			'click button.dumped': 'selectDumped',
		}
	});

	var recommendations = new RList();
	var rview = new RNView({
		collection: recommendations
	});
	rview.selectNew();
});
