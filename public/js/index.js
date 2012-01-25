$(document).ready(function() {
	$('#registerDialog').dialog({
		title: 'Registrate',
		buttons: {
			'Register': function() {
				$(this).children('form').submit();			
			},
			'Cancelar': function() {
				$(this).dialog('close');
			}
		},
		autoOpen: false
	});
	
	$('#loginDialog').dialog({
		title: 'Login',
		buttons: {
			'Login': function() {
				$(this).children('form').submit();			
			},
			'Cancelar': function() {
				$(this).dialog('close');
			}
		},
		autoOpen: false
	});
});

function register() {
	$('#registerDialog').dialog('open');
}

function login() {
	$('#loginDialog').dialog('open');
}
