var RView = Backbone.View.extend({
	tagName: "li",
	className: "recommendation",
/*	events: {
		"click .icon":          "open",
		"click .button.edit":   "openEditDialog",
		"click .button.delete": "destroy"
	},*/
	render: function() {
		console.log("render");
		console.log(this.model);
		$(this.el).html(this.model.id);
		return this;
	}
});

$(document).ready(function() {
	var RNView = Backbone.View.extend({
		el:$('#recommendations'),
		events: {
			'click button#add': 'addItem'
		},
		initialize: function() {
			_.bindAll(this, 'render', 'addItem'); // every function that uses 'this' as the current object should be in here
	      
			this.counter = 0; // total number of items added thus far
			this.render();
		},

		//render() now introduces a button to add a new list item.

		render: function() {
			$(this.el).append("<button id='add'>Add list item</button>");
			$(this.el).append("<ul></ul>");
		},

		//addItem(): Custom function called via click event above.

		addItem: function(){
			this.counter++;
			$('ul', this.el).append("<li>hello world"+this.counter+"</li>");
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
