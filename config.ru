#   Copyright (c) 2012, Hugo Alberto Massaroli  This file is
#   licensed under the Affero General Public License version 3 or later.  See
#   the COPYRIGHT file.

require 'rubygems'

log = File.new("/tmp/sinatra.log", "a")
STDOUT.reopen(log)
STDERR.reopen(log)

require './app.rb'

run Sinatra::Application
