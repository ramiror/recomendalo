# encoding: UTF-8
require 'sinatra'
require 'bundler/setup'
require 'dm-core'
require 'dm-validations'
require 'dm-migrations'
require 'dm-serializer'
require 'logger'
require 'json'
require 'pony'
require 'sinatra/flash'

### CONFIGURATION

DataMapper::Logger.new(STDOUT, :debug)

require './config.rb'

if ENV == :development
	require 'ruby-debug'
end

### CONSTANTS

MAIL_FROM = 'recomendalo@cimasoft.com.ar'

# constantes de recomendación
NEW = 1
QUEUED = 2
ALREADY_SEEN = 3
DUMPED = 4
OWN = 5

### MODELS

load 'models.rb'

DataMapper.finalize
DataMapper.auto_upgrade!

enable :sessions, :logging, :raise_errors

### HELPERS

helpers do	
	def base_url
		url ||= "#{request.env['rack.url_scheme']}://#{request.env['HTTP_HOST']}"
	end
	
	#TODO: cambiar de nombre por url
	def link(path)
		base_url+path
	end
	
	def img_link(image)
		link('upload/'+image)
	end
	
	# VIEW HELPERS
	def link_to(text, url)
		"<a href='#{url}'>#{text}</a>"
	end
	
	def ulink(username, fullname)
		"<a href='/#{username}'>#{fullname}</a>"
	end
end

def create_recommendation(page_id)
	@page = Page.first :id => page_id
	
	if !@page
		return false
	end

	fs = Follow.all :followed_id => session[:uid]
	# recomendamos el nuevo objeto a todos los que tenemos alrededor
	fs.each do |f|
		Recommendation.create :creator_id => session[:uid], :user_id => f.follower_id, :state => NEW, :page_id => page_id
		
		@user = f.follower
		if @user.notif_new_recommendation
			# mandamos un mail a cada usuario, si tienen activado el mandar mails
			Pony.mail :to => @user.email,
				:from => MAIL_FROM,
				:subject => "Nueva recomendación de #{@user.username}!",
				:body => haml(:notif_new_recommendation),
				:via => MAIL_VIA,
				:via_options => MAIL_VIA_OPTIONS,
				:content_type => 'text/html'
		end		
	end
	# creamos un objeto para nosotros mismos (si no tenemos ningún seguidor igual la recomendación aparece en nuestra página)
	Recommendation.create :creator_id => session[:uid], :user_id => session[:uid], :state => OWN, :page_id => page_id
end

### API METHODS

# TODO: pasar a los métodos HTTP correspondientes.
get '/users/follow/:uid' do |uid|
	user = User.first :id => uid
	
	if !user
		return "Usuario inválido"
	end	
	
	f = Follow.new(:follower_id=>session[:uid], :followed_id=>uid)
	if f.save
		# agarramos todas las recomendaciones de este chabón y las creamos para el usuario logueado
		recommendations = Recommendation.all :creator_id => user.id, :state => OWN
		recommendations.each do |r|
			Recommendation.create(:creator_id => r.creator_id, :page_id => r.page_id, :user_id => session[:uid], :state => NEW)
		end
		
		if user.notif_new_follower
			@user = user
			# mandamos un mail a cada usuario, si tienen activado el mandar mails
			Pony.mail :to => user.email,
				:from => MAIL_FROM,
				:subject => "Nuevo seguidor: @#{user.username}!",
				:body => haml(:notif_new_follower),
				:via => MAIL_VIA,
				:via_options => MAIL_VIA_OPTIONS,
				:content_type => 'text/html'
		end	
		redirect '/home'
	else
		"No se pudo guardar el Follow"
	end
end

#untested
get '/users/unfollow/:uid' do |uid|
	f = Follow.first(:followed_id=>uid)
	if f
		if f.destroy
			redirect '/home'
		end
	end
	"Follow inválido"
end

# actualiza una recomendación
put '/recommendations/:rid' do |rid|
	recommendation = Recommendation.first :id => rid
	
	if recommendation
		json = JSON.parse request.body.read
		update_params = {:state => json["state"]}
		recommendation.update(update_params)
		'success'
	else
		'error'
	end
end

# devuelve recomendaciones según el estado
get '/recommendations/:state' do |state| 
	case state
		when 'new'
			state = NEW
		when 'queued'
			state = QUEUED
		when 'already_seen'
			state = ALREADY_SEEN
		when 'dumped'
			state = DUMPED
		when 'own'
			state = OWN
		else
			halt 500
	end

	recommendations = Recommendation.all :state => state, :user_id => session[:uid]
	recommendations.to_json(:methods=>:page)
end

# crea una página
post '/pages' do
	json = JSON.parse request.body.read
	page = Page.new(json.merge(:creator_id=>session[:uid]))
	
	if page.save
		create_recommendation(page.id)

		page.to_json
	else
		halt 500
	end
end

# postea una imágen
post '/pages/image' do
	page = Page.first :id => params[:page_id]
	
	if !page
		return 'invalid page id'
	end
	
	if !params['image'][:tempfile]
		return 'invalid file'
	end
	
	filename = 'page_'+params[:page_id]+'_'+Time.now.to_i.to_s
	File.open('public/upload/'+filename, "wb") { |f| f.write(params['image'][:tempfile].read) }
	
	page.image = '/upload/'+filename
	page.save
	redirect '/home'
end

# crea una recomendación
post '/recommendations' do	
	create_recommendation(params[:page_id])
	'success'
end

# devuelve las páginas del usuario
get '/pages' do
	pages = Page.all :creator_id => session[:uid]
	pages.to_json
end

# busca una página entre varios medios de búsqueda
get '/search' do
	engines = [DbSearchEngine.new]
	
	pages = []
	engines.each do |engine|
		pages += engine.search params[:query]
	end
	pages.to_json
end

# devuelve todos los seguidores del usuario actual
get '/followers' do
	followers = Follow.all :followed_id => session[:uid]
	followers.to_json(:methods => :follower)
end

# devuelve todos los usuarios que el usuario actual está siguiendo
get '/followeds' do
	followers = Follow.all :follower_id => session[:uid]
	followers.to_json(:methods => :followed)
end

# borra una página
delete '/pages/:pid' do |pid|
	page = Page.first :id => pid
	if page.creator_id == session[:uid]
		page.destroy
	end
end

# crea un usuario
#TODO: llamar a esto por POST!
post '/register' do
	u = User.new(params)
	if u.save
		session[:uid] = u.id
		session[:fullname] = u.fullname
		redirect '/home'
	else
		flash[:error] = "No se pudo registrar el usuario, chequeá que todo esté bien"
		redirect '/'
	end
end

# edita un usuario
post '/users' do
	require 'ruby-debug'
	debugger
	u = User.first :id => session[:uid]
	
	# los browser no mandan las claves de los checkboxes cuando estos están destilados
	if !params.include? 'notif_new_recommendation'
		params['notif_new_recommendation'] = 0
	end
		
	if !params.include? 'notif_new_follower'
		params['notif_new_follower'] = 0
	end
		
	if !params.include? 'notif_newsletter'
		params['notif_newsletter'] = 0
	end
	
	u.attributes = params
	#u.update(params)
	if u.save
		session[:fullname] = u.fullname
		'success'
	else
		'failure'
	end
end

# sube un avatar de usuario
post '/users/photo' do
	user = User.first :id => session[:uid]
	
	if !user
		return 'invalid session'
	end
	
	if !params['photo'][:tempfile]
		return 'invalid file'
	end
	
	filename = 'user_'+session[:uid].to_s+'_'+Time.now.to_i.to_s
	File.open('public/upload/'+filename, "wb") { |f| f.write(params['photo'][:tempfile].read) }
	
	user.photo = '/upload/'+filename
	user.save
	redirect '/home'
end

### ACTIONS (páginas)

get '/' do
	if session[:uid]
		redirect '/home'
	else
		haml :index
	end
end

get '/home' do
	@user = User.first :id => session[:uid]
	haml :home
end

post '/login' do
	u = User.all(:email => params[:login], :password => params[:password]) | User.all(:username => params[:login], :password => params[:password])
	if u.size > 0
		session[:uid] = u[0].id
		session[:fullname] = u[0].fullname
		redirect '/home'
	else
		'Autenticación inválida'
	end
end

get '/logout' do
	session[:uid] = nil
	session[:fullname] = nil
	redirect "/", 303
end

get '/users_search' do
	@user = User.first :id => session[:uid]
	haml :users_search
end

get '/users' do
	users = User.all
	users.to_json
end

# muestra la página del usuario
get '/:username' do |username|
	@user = User.first :username => username
	
	if @user 
		@following = Follow.first :follower_id => session[:uid], :followed_id => @user.id
		@recommendations = Recommendation.all :creator_id => @user.id, :state => OWN
		haml :profile
	else
		halt 404
	end
end

# formulario de subida de la foto
get '/users/photo' do
	@user = User.first :id => session[:uid]
	haml :user_photo
end

# SEARCH ENGINES

class SearchEngine
	def search(query)
		raise NotImplementedError
	end
end

# busca pages en la base de datos local
class DbSearchEngine < SearchEngine
	def search(query)
		query_like = '%'+query+'%'
		return Page.all(:title.like => query_like) | Page.all(:description.like => query_like)
	end
end
