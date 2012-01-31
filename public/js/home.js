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
			$(this.el).html(compiled({title:this.model.get('page').title, desc: this.model.get('page').description}));
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
		initialize: function(opts) {
			_.bindAll(this, 'render', 'selectNew', 'selectQueued', 'selectSeen', 'selectDumped', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new RList();
			}
			
			//this.collection.bind('add', this.appendItem); // collection event binder	      
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
				self.collection.reset(data);
				self.render();	
			});
    		},
		events: {
			'click button.new': 'selectNew',
			'click button.seen': 'selectSeen',
			'click button.queued': 'selectQueued',
			'click button.dumped': 'selectDumped'
		}
	});
	

	var PageView = Backbone.View.extend({
		tagName: 'li', // name of (orphan) root tag in this.el
		initialize: function(){
 			_.bindAll(this, 'render', 'unrender', 'remove', 'edit'); // every function that uses 'this' as the current object should be in here
 			
 			this.model.bind('change', this.render);
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			var compiled = _.template('<div class="page-title"><%= title %></div> <div class="page-description"><%= desc %></div> <div class="clear"></div> &nbsp;<span class="edit" style="cursor:pointer; color:red; font-family:sans-serif;">[editar]</span> &nbsp;<span class="delete" style="cursor:pointer; color:red; font-family:sans-serif;">[borrar]</span>');
			$(this.el).html(compiled({title:this.model.get('title'), desc: this.model.get('description')}));
			return this; // for chainable calls, like .render().el
    		},
		unrender: function(){
			$(this.el).remove();
		},
		edit: function() {
			//TODO: abre el mismo diálogo que antes pero permite editar.
			console.log("editar");
		},
		remove: function() {
			this.model.destroy();
		},
		events: {
			'click span.delete': 'remove',
			'click span.edit': 'edit',
		}
	});
	
	var SearchPageView = Backbone.View.extend({
		el:$('#searchpages'),
		initialize: function(opts) {
			_.bindAll(this, 'render', 'search', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new PageList();
			}
			
			this.collection.bind('add', this.appendItem); // collection event bind
			this.render();
		},
		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			$(this.el).html(''); //borramos datos del elemento, si los hubiera
			
			$(this.el).append("<input type='text' name='query' />");
			$(this.el).append("<button class='buscar'>Buscar</button>");
			
			$(this.el).append("<ul></ul>");
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
				self.appendItem(item);
			}, this);
		},
		appendItem: function(item){
			var pageView = new PageView({
				model: item
			});
			$('ul', this.el).append(pageView.render().el);
		},
		search: function() {	
			var self = this;
			var query = this.el.find('input[name=query]').val();
			$.getJSON('/search', {query:query}, function(data) {
				self.collection.reset(data);
				self.render();
				self.el.find('input[name=query]').val(query)
			});
		},
		events: {
			'click button.buscar' : 'search'
		}
	});
	
	var PageNView = Backbone.View.extend({
		el:$('#pages'),
		initialize: function(opts) {
			_.bindAll(this, 'render', 'load', 'createPage', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new PageList();
			}
			
			this.collection.bind('add', this.appendItem); // collection event bind
			this.render();
		},
		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			$(this.el).html(''); //borramos datos del elemento, si los hubiera
			
			$(this.el).append("<button class='recommend'>Crear página</button>");
			
			$(this.el).append("<ul></ul>");
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		appendItem: function(item){
			var pageView = new PageView({
				model: item
			});
			$('ul', this.el).append(pageView.render().el);
    		},
    		load: function() {	
    			var self = this;
			$.getJSON('/pages', function(data) {
				self.collection.reset(data);
				self.render();	
			});
    		},
    	createPage: function() {
    			var self = this;
    			
    			$('#createPageDialog').dialog({
    				title: "Crear recomendación",
    				buttons: {
    					"Crear": function() {
						self.collection.create({
							title: $('#pageTitle').val(),
							description: $('#pageDescription').val(),
							website: $('#pageWebsite').val()
						}, {
							success: function() {
								console.log("success");
							},
							error: function(model, response) {
								console.log("error");
							}
						});
 						$(this).dialog("close");						
    					},
    					"Cancelar": function() {
    						$(this).dialog("close");
    					}
    				}
    			});
    		},
		events: {
			'click button.recommend' : 'createPage'
		}
	});
	

	// inicialización
	var recommendations = new RList();
	var rview = new RNView({
		collection: recommendations
	});
	rview.selectNew();
	
	var pages = new PageList();
	var pview = new PageNView({
		collection: pages
	});
	pview.load();
	
	var searchView = new SearchPageView({});
});
