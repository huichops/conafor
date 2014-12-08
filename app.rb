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

get '/download/:name' do |name|
  send_file "./public/files/#{name}", filename: name, type: "Application/octet-stream"
end

get '/hello' do
  "Hello World!"
end

get '/get_domain/:field' do
  settings.mongo_db['listados'] 
  .distinct(params[:field]).sort.to_json
end

get '/cantidad_solicitado/*' do |year|

  query = [ 
    { "$group" => {
      _id: { 
        code: "$code",
        region: "$region"
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
      region: params[:code].to_i
    }},
    { "$group" => {
      _id: {
        region: "$code"
      },
      total: {
        "$sum" => 1
      }
    }}
  ]).to_a.first.to_json
end

get '/total_solicitado/summary/:code/*.*' do
  name = params[:splat].first
  value = params[:splat].last

  query = [ 
    { "$match" => {
      region: params[:code].to_i
    }},
    { "$group" => {
      _id: { 
        region: "$region",
        name: "$region_name",
        fecha: "$fecha"
      },
      total: {
        "$sum" => "$monto_solicitado"
      },
      promedio: {
        "$avg" => "$monto_solicitado"
      },
      cantidad: {
        "$sum" => 1
      }
    }},
    { "$sort" => {
      total: 1
    }},
    { "$project" => {
      fecha: "$_id.fecha",
      total: "$total",
      promedio: "$promedio",
      cantidad: "$cantidad",
      _id: 0
    }}
  ]

  unless name == 'none'
    value  = value.to_i == 0? value : value.to_i
    query.unshift({ "$match" => {
      name.to_sym => value
    }})
  end

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json
end

get '/total_solicitado/*.*' do

  name = params[:splat].first
  value = params[:splat].last

  query = [ 
    { "$group" => {
      _id: { 
        code: "$code",
        name: "$region_name",
        region: "$region"
      },
      total: {
        "$sum" => "$monto_solicitado"
      },
      promedio: {
        "$avg" => "$monto_solicitado"
      },
      cantidad: {
        "$sum" => 1
      }
    }},
    { "$sort" => {
      cantidad: 1
    }}
  ]

  unless name == 'none'
    value  = value.to_i == 0? value : value.to_i
    query.unshift({ "$match" => {
      name.to_sym => value
    }})
  end

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json
end

get '/region_by_code' do
  content_type :json

  query = [ 
    { "$group" => {
      _id: { 
        name: "$region_name",
        code: "$code",
        region: "$region"
      }
    }}]

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json
end

get '/grupo_apoyo_region' do
  content_type :json

  query = [ 
    { "$group" => {
      _id: { 
        name: "$region_name",
        region: "$region",
      },
      sum: { "$sum" =>  1 }
    }}]

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json
end

get '/:estado' do
  content_type :json

  query = {}
  query[:estado] = params[:estado]
  p query

  settings.mongo_db['listados'].find(query).limit(100).to_a.to_json
end
