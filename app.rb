# Configuración inicial
# ### Dependencias
# Sinatra para nuestro servidor web
require 'sinatra'
# Conector de mongoDB para la base de datos
require 'mongo'
# Motor de plantillas para enviar las vistas
require 'slim'
# JSON para enviar respuestas asíncronas en este formato
require 'json/ext'

include Mongo

# ### Configuración
configure do
# Conexión a la base de datos
  conn = MongoClient.new("localhost", 27017)
  set :mongo_connection, conn
# Variable donde tendremos nuestra conexión
  set :mongo_db, conn.db("conafor")
end

# ### Rutas

# Ruta de inicio donde se carga nuestra
# plantilla con angularJS, ya que la lógica se
# ejecuta del lado del cliente
get '/' do
  slim :index
end

# En esta ruta obtenemos los templates de slim
# para enviar el html cuando la ruta de angular 
# así lo necesite
get '/templates/*.html' do |name|
  slim name.to_sym, layout: false
end

# Con esta ruta envíamos un archivo para descargar
# desde `/public/files`. Esta se usa para poder descargar
# las fichas en esa sección
get '/download/:name' do |name|
  send_file "./public/files/#{name}", filename: name, type: "Application/octet-stream"
end

# En esta ruta obtenemos los posibles valores para el campo
# que halla sido enviado como parámetro haciendo un *distinct*
# en la colección
get '/get_domain/:field' do
  settings.mongo_db['listados'] 
  .distinct(params[:field]).sort.to_json
end

# Aquí podemos obtener la ficha de resumen del monto solicitado
# para la región seleccionado con la posibilidad de agregar un filtro
get '/total_solicitado/summary/:code/*.*' do
  name = params[:splat].first
  value = params[:splat].last

# Pasamos el parámetro *:code* para filtrar por esa región
  query = [ 
    { "$match" => {
      region: params[:code].to_i
    }},
# Agrupamos en base a la región y a la fecha para tener
# los datos separados según la fecha en cada una de las regiones
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

# Si tenemos filtros que agregar añadimos esa sentencia *$match*
# al inicio de nuestra consulta para hacer el filtrado 
  unless name == 'none'
    value  = value.to_i == 0? value : value.to_i
    query.unshift({ "$match" => {
      name.to_sym => value
    }})
  end

  settings.mongo_db['listados'] 
  .aggregate(query).to_a.to_json
end

# Similar al resumen pero obtenemos las métricas para todas las regiones
# y no solo la que hallamos seleccionado
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

# En esta ruta vamos a obtener los valores agrupados de cada región
# con su código de estado
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

# Aquí agrupamos las cantidades de montos según el campo
# que halla sido seleccionado en nuestro parametro *:filter*
get '/by/:filter' do |filter|
  content_type :json

  query = [ 
    { "$group" => {
      _id: { 
        filter: "$#{filter}" 
      },
      sum: { "$sum" =>  1 }
    }},
    { "$sort" => {
      "_id.filter" =>  1
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

# Todos los montos solicitados para la región seleccionada
get '/:region' do
  content_type :json

  query = {}
  query[:region] = params[:region]
  p query

  settings.mongo_db['listados'].find(query).to_a.to_json
end
