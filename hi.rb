# encoding: UTF-8
require 'sinatra'
require 'bundler/setup'
require 'dm-core'
require 'dm-validations'
require 'dm-migrations'
require 'dm-serializer'
require 'logger'
require 'json'

### CONFIGURATION

DataMapper::Logger.new(STDOUT, :debug)

if File.exists? "config.rb"
	require './config.rb'
else
	puts "No hay ningún archivo config.rb creado."
	exit
end

### CONSTANTS

# constantes de recomendación
NEW = 1
QUEUED = 2
ALREADY_SEEN = 3
DUMPED = 4

### MODELS

load 'models.rb'

DataMapper.finalize
DataMapper.auto_upgrade!

enable :sessions, :logging, :raise_errors

### HELPERS

helpers do
	def ulink(username, fullname)
		"<a href='/#{username}'>#{fullname}</a>"
	end
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
		redirect '/home'
	else
		"No se pudo guardar el Follow"
	end
end

#untested
get '/users/unfollow/:uid' do |uid|
	f = Follow.first(:followed_id=>uid)
	if f
		f.destroy
	else
		"Follow inválido"
	end
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
		# recomendamos el nuevo objeto a todos los que tenemos alrededor
		fs = Follow.all :followed_id=>session[:uid]
		fs.each do |f|
			r = Recommendation.new :creator_id => session[:uid], :user_id => f.follower_id, :state => NEW, :page_id => page.id
			r.save
		end

		halt 200
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
	fs = Follow.all :followed_id => session[:uid]
	fs.each do |f|
		r = Recommendation.new :creator_id => session[:uid], :user_id => f.follower_id, :state => NEW, :page_id => params[:page_id]
		r.save
	end
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
post '/register' do
	u = User.new(params)
	if u.save
		session[:uid] = u.id
		session[:fullname] = u.fullname
		redirect '/home'
	else
		"No se pudo guardar el usuario "+params.inspect
	end
end

# edita un usuario
post '/users' do
	u = User.first :id => session[:uid]
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

get '/users' do
	@users = User.all
	haml :users
end

# muestra la página del usuario
get '/:username' do |username|
	@user = User.first :username => username
	
	if @user 
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
