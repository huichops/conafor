require 'sinatra'
require 'mongo'
require 'slim'
require 'json/ext'

include Mongo

configure do
  conn = MongoClient.new("localhost", 27017)
  set :mongo_connection, conn
  set :mongo_db, conn.db("conafor")
end

get '/' do
  slim :index
end

get '/templates/*.html' do |name|
  slim name.to_sym, layout: false
end

get '/hello' do
  "Hello World!"
end

get '/total_solicitado' do
  settings.mongo_db['listados'] 
  .aggregate([ 
    { "$group" => {
      _id: { 
        code: "$code"
      },
      total_solicitado: {
        "$sum" => "$monto_solicitado"
      }
    }}
  ]).to_a.to_json
end

get '/:estado' do
  content_type :json

  query = {}
  query[:estado] = params[:estado]
  p query

  settings.mongo_db['listados'].find(query).limit(100).to_a.to_json
end

