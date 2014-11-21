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

get '/get_domain/:field' do
  settings.mongo_db['listados'] 
  .distinct(params[:field]).to_json
end

get '/cantidad_solicitado/*' do |year|

  query = [ 
    { "$group" => {
      _id: { 
        code: "$code"
      },
      cantidad: {
        "$sum" => 1
      }
    }},
    { "$sort" => {
      cantidad: 1
    }}
  ]

  unless year.nil?
   query.unshift({ "$match" => {
      fecha: params[:year]
    }})
  end

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json

end

get '/cantidad_solicitado/summary/:code' do
  p params[:code]
  settings.mongo_db['listados'] 
  .aggregate([ 
    { "$match" => {
      code: params[:code].to_i
    }},
    { "$group" => {
      _id: {
        code: "$code"
      },
      total: {
        "$sum" => 1
      }
    }}
  ]).to_a.first.to_json
end

get '/total_solicitado' do
  settings.mongo_db['listados'] 
  .aggregate([ 
    { "$group" => {
      _id: { 
        code: "$code"
      },
      promedio: {
        "$avg" => "$monto_solicitado"
      }
    }},
    { "$sort" => {
      total_solicitado: 1
    }}
  ]).to_a.to_json
end

get '/total_solicitado/?:year?' do

  query = [ 
    { "$group" => {
      _id: { 
        code: "$code"
      },
      total: {
        "$sum" => "$monto_solicitado"
      },
      promedio: {
        "$avg" => "$monto_solicitado"
      }
    }},
    { "$sort" => {
      total: 1
    }}
  ]

  unless params[:year].nil?
   query.unshift({ "$match" => {
      fecha: params[:year].to_i
    }})
  end

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json

end

get '/total_solicitado/summary/:code' do
  p params[:code]
  settings.mongo_db['listados'] 
  .aggregate([ 
    { "$match" => {
      code: params[:code].to_i
    }},
    { "$group" => {
      _id: "$code",
      total: {
        "$sum" => "$monto_solicitado"
      },
      cantidad: {
        "$sum" => 1
      },
      avg: {
        "$avg" => "$monto_solicitado"
      }
    }}
  ]).to_a.first.to_json

end

get '/:estado' do
  content_type :json

  query = {}
  query[:estado] = params[:estado]
  p query

  settings.mongo_db['listados'].find(query).limit(100).to_a.to_json
end

