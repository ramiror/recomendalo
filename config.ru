require 'rubygems'
require 'sinatra'

log = File.new("/tmp/sinatra.log", "a")
STDOUT.reopen(log)
STDERR.reopen(log)

require './hi.rb'

run Sinatra::Application
