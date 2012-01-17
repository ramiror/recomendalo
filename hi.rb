# encoding: UTF-8
require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'dm-core'
require 'dm-validations'
require 'dm-migrations'
require 'dm-serializer'
require 'logger'

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

class Obj
  include DataMapper::Resource
  property :id,         Serial
  property :title,      String
  property :created_at, DateTime
  property :creator_id, Integer
  property :description,Text

  validates_presence_of :title
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
  property :obj_id,     Integer

  validates_presence_of :state
  validates_presence_of :user_id
  validates_presence_of :creator_id
  validates_presence_of :obj_id

  belongs_to :obj
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
	@objs = Obj.all :order=>[:created_at]
	haml :index
end

get '/register' do
	haml :register
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

get '/home' do
	@recommendations = Recommendation.all :user_id => session[:uid]
	@objs = Obj.all :creator_id => session[:uid]
	haml :home
end

get '/obj/add' do
	haml :obj_add
end

post '/obj/add' do
	o = Obj.new(params.merge(:creator_id=>session[:uid]))
	if o.save
		# recomendamos el nuevo objeto a todos los que tenemos alrededor
		fs = Follow.all :uid2=>session[:uid]
		fs.each do |f|
			r = Recommendation.new :creator_id => session[:uid], :user_id => f.uid1, :state => NEW, :obj_id => o.id
			r.save
		end

		redirect '/home'
	else
		"No se pudo guardar el objeto"
	end
end

get '/obj/edit' do
	haml :obj_edit
end

get '/obj/view' do

end

post '/obj/recommend' do

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

# hay que ir pasando los métodos que soporte el API acá.

# este es de prueba, no se si va a quedar
post '/users' do
	# acá poner los parámetros
	# y cambiar el método para que sea un registro!
	"eaaaaaaaaaaaaaah"
end

get '/recommendations' do
	"asdgasdgsa"
end
