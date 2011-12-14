# encoding: UTF-8
require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'dm-core'
require 'dm-validations'
require 'dm-migrations'
require 'logger'

### CONFIGURATION

DataMapper.setup(:default, {
    :adapter  => 'mysql',
    :host     => 'localhost',
    :username => 'root' ,
    :password => '123456',
    :database => 'recomiendo'})  

DataMapper::Logger.new(STDOUT, :debug)

### MODELS

class Obj
  include DataMapper::Resource
  property :id,         Serial
  property :title,      String
  property :created_at, DateTime
  property :creator_id, Integer
  property :description,String

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
end

class Recommendation
  include DataMapper::Resource
  property :id,         Serial
  property :creator_id, Integer
  property :user_id,    Integer
  property :created_at, DateTime
  property :state,      Integer

  validates_presence_of :state
  validates_presence_of :user_id
  validates_presence_of :creator_id
end

class Friendship
  include DataMapper::Resource
  property :uid1,       Integer, :key => true
  property :uid2,       Integer, :key => true
end

DataMapper.auto_migrate!

enable :sessions

get '/' do
	@objs = Obj.all :order=>[:created_at]
	haml :index
end

get '/register' do
	"Registrate"
end

get '/home' do
	haml :home
end

get '/obj/add' do
	haml :obj_add
end

post '/obj/add' do
	
end

get '/obj/view' do

end

post '/obj/recommend' do

end

post '/login' do
	"Acá te estás logueando"
end

get '/logout' do
	session[:uid] = nil
	session[:username] = nil
	redirect "/", 303
end

# Métodos de prueba

get '/login_u1' do
	session[:uid] = 1
	session[:username] = "Jorgito"
	redirect "/", 303 
end

get '/login_u2' do
	session[:uid] = 2
	session[:username] = "Juancito"
	redirect "/", 303 
end
