require 'sinatra'
require 'mongo'
require 'json/ext'

include Mongo

configure do
  conn = MongoClient.new("localhost", 27017)
  set :mongo_connection, conn
  set :mongo_db, conn.db("conafor")
end

get '/hello' do
  "Hello World!"
end

get '/:estado/:municipio' do
  content_type :json

  query = {}
  query[:estado] = params[:estado]
  query[:municipio] = params[:municipio]
  p query

  settings.mongo_db['listados'].find(query).to_a.to_json
end
