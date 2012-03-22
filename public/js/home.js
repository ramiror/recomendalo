//   Copyright (c) 2012, Hugo Alberto Massaroli  This file is
//   licensed under the Affero General Public License version 3 or later.  See
//   the COPYRIGHT file.

var rview;
var pview;
var searchView;
var followersView;
var followedsView;

$(document).ready(function() {
	var RView = Backbone.View.extend({
		tagName: 'li', // name of (orphan) root tag in this.el
		initialize: function(){
 			_.bindAll(this, 'render', 'unrender', 'remove','alreadyseen', 'viewlater'); // every function that uses 'this' as the current object should be in here
 			
 			this.model.bind('change', this.render);
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			var html = '';
			
			if (this.model.get('page').image) {
					html += "<img src='<%= image %>' class='recommendation-image left'>";
			}
			
			html += '<h3><%= title %></h3><p><%= desc %></p><div class="clear"></div>';
			
			if (this.options.section != 'own') {
				if (this.options.section != 'queued')
					html += '<span class="viewlater pageButton">[ver mas tarde]</span>';
				if (this.options.section != 'seen')
					html+='<span class="alreadyseen pageButton">[ya lo vi]</span>';
				if (this.options.section != 'dumped')	
					html+='<span class="delete pageButton">[botar]</span>';
			}
				
			var compiled = _.template(html);
			$(this.el).html(compiled({title:this.model.get('page').title, desc: this.model.get('page').description, image: this.model.get('page').image}));
			return this; // for chainable calls, like .render().el
		},
		unrender: function(){
			$(this.el).remove();
		},
		alreadyseen: function() {
			this.model.save({state:ALREADY_SEEN});
			this.unrender();
		},
		viewlater: function() {
			this.model.save({state:QUEUED});
			this.unrender();
		},		
		remove: function() {
			this.model.save({state:DUMPED});
			this.unrender();
		},
		events: {
			'click span.delete': 'remove',
			'click span.viewlater': 'viewlater',
			'click span.alreadyseen': 'alreadyseen'
		}
	});

	var RNView = Backbone.View.extend({
		initialize: function(opts) {
			_.bindAll(this, 'render', 'selectSection', 'selectNew', 'selectQueued', 'selectSeen', 'selectDumped', 'appendItem'); // every function that uses 'this' as the current object should be in here
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
			
			var html = _.template( $("#recommendations-section").html(), {});
			$(this.el).html(html);
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		selectSection: function() {
			//TODO; arreglar porque no funciona
			$('li', this.el).removeClass('active');
			$('li.'+this.section, this.el).addClass('active');
		},
		appendItem: function(item){
			var itemView = new RView({
				model: item,
				section: this.section
			});
			$('.content', this.el).append(itemView.render().el);
    	},
		selectNew: function() {
    		var self = this;
    		this.section = 'new';
			$.getJSON('/recommendations/new', function(data) {
				self.collection.reset(data);
				self.render();	
			});
			this.selectSection();
    	},
    	selectQueued: function() {
    		var self = this;
    		this.section = 'queued';
			$.getJSON('/recommendations/queued', function(data) {
				self.collection.reset(data);
				self.render();	
			});
			this.selectSection();
    	},
    	selectSeen: function() {
    		var self = this;
    		this.section = 'seen';
			$.getJSON('/recommendations/already_seen', function(data) {
				self.collection.reset(data);
				self.render();	
			});
			this.selectSection();
    	},
    	selectDumped: function() {
    		var self = this;
    		this.section = 'dumped';
			$.getJSON('/recommendations/dumped', function(data) {
				self.collection.reset(data);
				self.render();	
			});
			this.selectSection();
    	},
    	selectOwn: function() {
			var self = this;
			this.section = 'own';
			$.getJSON('/recommendations/own', function(data) {
				self.collection.reset(data);
				self.render();	
			});
			this.selectSection();
		},
		events: {
			'click li.new a': 'selectNew',
			'click li.dumped a': 'selectDumped',
			'click li.seen a': 'selectSeen',
			'click li.own a': 'selectOwn',
			'click li.queued a': 'selectQueued'
		}
	});

	var PageView = Backbone.View.extend({
		tagName: 'li', // name of (orphan) root tag in this.el
		initialize: function(opts){
 			_.bindAll(this, 'render', 'unrender', 'remove', 'edit', 'recommend','upload_image'); // every function that uses 'this' as the current object should be in here
 			this.model.bind('change', this.render);
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			var image;
			if (this.model.get('image')) {
				image = '<img src="'+this.model.get('image')+'" class="page-image"/>';
			} else {
				image = '<img src="" class="page-image" alt="No image"/>';
			}
			
			var html = image + '<div class="page-title"><%= title %></div> <div class="page-description"><%= desc %></div> <div class="clear"></div>';
			if (this.options.buttons.recommend) 
				html += '<span class="recommend pageButton">[recomendar]</span>';
			/*if (this.options.buttons.edit) 
				html += '<span class="edit pageButton">[editar]</span>';*/
			if (this.options.buttons.remove) 
				html += '<span class="delete pageButton">[borrar]</span>';
			
			var compiled = _.template(html);
			
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
		upload_image: function() {
			$('#page-id-field').val(this.model.get('id'));
			$('#uploadImageDialog').dialog({
				title:'Subir imágen',
				buttons: {
					'Subir':function() {
						$('form', this).submit();
					},
					'Cancelar':function() {
						$(this).dialog('close');
					}
				}
			});
		},
		recommend: function() {
			$.ajax('/recommendations', {
					data: {
						page_id: this.model.get('id'),
					},
					type:'POST'
			}, function(data) {
				console.log(data);
			});
		},
		events: {
			'click span.delete': 'remove',
			'click span.edit': 'edit',
			'click span.recommend': 'recommend',
			'click img.page-image': 'upload_image'
		}
	});
	
	var SearchPageView = Backbone.View.extend({
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
			
			//borramos datos del elemento, si los hubiera y copiamos lo que haya en empty section
			$(this.el).html(_.template( $("#search-section").html(), {}));
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
				self.appendItem(item);
			}, this);
		},
		appendItem: function(item){
			var pageView = new PageView({
				model: item,
				buttons:{
					recommend:true,
					remove:false,
					edit:false
				}
			});
			$('ul.content', this.el).append(pageView.render().el);
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
			
			//borramos datos del elemento, si los hubiera y copiamos lo que haya en empty section
			$(this.el).html(_.template( $("#pages-section").html(), {}));
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		appendItem: function(item){
			var pageView = new PageView({
				model: item,
				buttons:{
					recommend:false,
					remove:false,	
					edit:true
				}
			});
			$('ul.content', this.el).append(pageView.render().el);
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
							success: function(page) {
								//console.log(page);
								//console.log("success");
							},
							error: function(model, response) {
								//console.log("error");
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
	
	var FollowersView = Backbone.View.extend({
		initialize: function(opts) {
			_.bindAll(this, 'render', 'load', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new FollowerList();
			}
			
			this.collection.bind('add', this.appendItem); // collection event bind
			this.render();
		},
		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			//borramos datos del elemento, si los hubiera y copiamos lo que haya en empty section
			$(this.el).html(_.template( $("#followers-section").html(), {}));
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		appendItem: function(item){
			var user = new UserModel(item.get('follower'));
			var userView = new UserView({
				model: user,
				buttons:{
					follow:true,
					unfollow:false
				}
			});
			$('ul.content', this.el).append(userView.render().el);
		},
		load: function() {
			var self = this;
			$.getJSON('/followers', function(data) {
				self.collection.reset(data);
				self.render();	
			});
		},
		events: {}
	});
	
	var FollowingView = Backbone.View.extend({
		initialize: function(opts) {
			_.bindAll(this, 'render', 'load', 'appendItem'); // every function that uses 'this' as the current object should be in here
			if (opts.collection != undefined) {
				this.collection = opts.collection;
			} else {
				this.collection = new FollowingList();
			}
			
			this.collection.bind('add', this.appendItem); // collection event bind
			this.render();
		},
		//render() now introduces a button to add a new list item.
		render: function() {
			var self = this;
			
			//borramos datos del elemento, si los hubiera y copiamos lo que haya en empty section
			$(this.el).html(_.template( $("#following-section").html(), {}));
			
			_(this.collection.models).each(function(item){ // in case collection is not empty
		        	self.appendItem(item);
		      	}, this);
		},
		appendItem: function(item){
			var user = new UserModel(item.get('followed'));
			var userView = new UserView({
				model: user,
				buttons:{
					follow:false,
					unfollow:true
				}
			});
			$('ul.content', this.el).append(userView.render().el);
		},
		load: function() {
			var self = this;
			$.getJSON('/followeds', function(data) {
				self.collection.reset(data);
				self.render();	
			});
		},
		events: {}
	});

	// inicialización
	rview = new RNView({
		collection: new RList(),
		el:$('#list-content'),
	});
	rview.selectNew();
	
	pview = new PageNView({
		collection: new PageList(),
		el:$('#list-content'),
	});
	
	searchView = new SearchPageView({
		el:$('#list-content'),
	});
	
	followersView = new FollowersView({
		el:$('#list-content'),
	});
	
	followedsView = new FollowingView({
		el:$('#list-content'),
	});
	
	//dialogs
	
	$('#editProfileDialog').dialog({
		title: 'Editar perfil',
		buttons: {
			'Editar': function() {
				$.post('/users', $(this).children('form').first().serialize(), function(response) {
					if (response == 'success') {
						location.reload();
					} else {
						alert('Hubo un problema al editar el perfil');
					}
				});
			},
			'Cancelar': function() {
				$(this).dialog('close');
			}
		},
		autoOpen: false
	});
});

function editProfile() {
	$('#editProfileDialog').dialog('open');
}

function showRecommendations() {
	$('#home-menu li').removeClass('active');
	$('#show-recommendations').addClass('active');
	rview.selectNew();
}

function showSearchPages() {
	$('#home-menu li').removeClass('active');
	$('#show-search-pages').addClass('active');
	alert("implementar");
}

function showPages() {
	$('#home-menu li').removeClass('active');
	$('#show-pages').addClass('active');
	pview.load();
}

function showFollowers() {
	$('#home-menu li').removeClass('active');
	$('#show-followers').addClass('active');
	followersView.load();
}

function showFolloweds() {
	$('#home-menu li').removeClass('active');
	$('#show-followeds').addClass('active');
	followedsView.load();
}
