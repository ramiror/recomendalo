# encoding: UTF-8
require 'bundler/setup'
require 'dm-core'
require 'dm-validations'
require 'dm-migrations'
require 'dm-serializer'
require 'logger'
require 'json'

### CONFIGURATION

DataMapper.setup(:default, {
    :adapter  => 'mysql',
    :host     => 'localhost',
    :username => 'root' ,
    :password => '123456',
    :database => 'recomiendo'})  

DataMapper::Logger.new(STDOUT, :debug)

### CONSTANTS

# constantes de recomendación
NEW = 1
QUEUED = 2
ALREADY_SEEN = 3
DUMPED = 4

### MODELS

#TODO: cambiar 'obj' a 'page'
class Page
  include DataMapper::Resource
  property :id,         Serial
  property :title,      String
  property :created_at, DateTime
  property :creator_id, Integer
  property :description,Text
  property :website,    String

  validates_presence_of :title
  validates_presence_of :description
end

class User
  include DataMapper::Resource
  property :id,         Serial
  property :username,   String
  property :password,   String
  property :created_at, DateTime

  validates_presence_of :username
  validates_presence_of :password

  has n, :recommendations, :throughs => :creator_id
end

class Recommendation
  include DataMapper::Resource
  property :id,         Serial
  property :creator_id, Integer
  property :user_id,    Integer
  property :created_at, DateTime
  property :state,      Integer
  property :page_id,     Integer

  validates_presence_of :state
  validates_presence_of :user_id
  validates_presence_of :creator_id
  validates_presence_of :page_id

  belongs_to :page
end

class Friendship
  include DataMapper::Resource
  property :uid1,       Integer, :key => true
  property :uid2,       Integer, :key => true
end

class Follow
  include DataMapper::Resource
  property :uid1,       Integer, :key => true
  property :uid2,       Integer, :key => true
end

DataMapper.finalize
DataMapper.auto_upgrade!

enable :sessions, :logging, :raise_errors

### HELPERS

helpers do
	def ulink(uid, username)
		"<a href='/user/#{uid}'>#{username}</a>"
	end
end

### ACTIONS

get '/' do
	haml :index
end

get '/register' do
	haml :register
end

get '/home' do
	haml :home
end

post '/login' do
	u = User.all(:username => params[:username], :password => params[:password])
	if u.size > 0
		session[:uid] = u[0].id
		session[:username] = u[0].username
		redirect '/home'
	else
		'Autenticación inválida'
	end
end

get '/logout' do
	session[:uid] = nil
	session[:username] = nil
	redirect "/", 303
end

get '/users' do
	@users = User.all
	haml :users
end

get '/users/follow/:uid' do |uid|
	@user = User.first :id => uid
	
	if !@user
		return "Usuario inválido"
	end	
	f = Follow.new(:uid1=>session[:uid], :uid2=>uid)
	if f.save
		redirect '/home'
	else
		"No se pudo guardar el Follow"
	end
end

#untested
get '/users/unfollow/:uid' do |uid|
	f = Follow.first(:uid2=>uid)
	if f
		f.destroy
	else
		"Follow inválido"
	end
end

get '/user/:uid' do |uid|
	@user = User.first :id => uid
	haml :user
end

### API METHODS

# actualiza una recomendación
put '/recommendations/:rid' do |rid|
	@recommendation = Recommendation.first :id => rid
	
	if @recommendation
		json = JSON.parse request.body.read
		update_params = {:state => json["state"]}
		@recommendation.update(update_params)
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

	@recommendations = Recommendation.all :state => state, :user_id => session[:uid]
	@recommendations.to_json(:methods=>:page)
end

# crea una página
post '/pages' do
	json = JSON.parse request.body.read
	page = Page.new(json.merge(:creator_id=>session[:uid]))		
	if page.save
		# recomendamos el nuevo objeto a todos los que tenemos alrededor
		fs = Follow.all :uid2=>session[:uid]
		fs.each do |f|
			r = Recommendation.new :creator_id => session[:uid], :user_id => f.uid1, :state => NEW, :page_id => page.id
			r.save
		end

		halt 200
	else
		halt 500
	end
end

# devuelve las páginas del usuario
get '/pages' do
	@pages = Page.all :creator_id => session[:uid]
	@pages.to_json
end

delete '/pages/:pid' do |pid|
	@page = Page.first :id => pid
	if @page.creator_id == session[:uid]
		@page.destroy
	end
end

post '/register' do
	u = User.new(params)
	if u.save
		session[:uid] = u.id
		session[:username] = u.username
		redirect '/home'
	else
		"No se pudo guardar el usuario "+params.inspect
	end
end
