require 'rubygems'
require 'rest_client'

token = File.readlines '../token.txt'

url = 'http://localhost:3002/api/user/load'
 
response = RestClient::Request.execute(
              method: :post,
              url: url,
              clientId: 'ExampleCompany',
              email: 'demo@example.com',
              :headers => { 
                :content_type => :json,
                :accept => :json,
                :token => token
              }
            )
 
puts response.body