import time, requests, os

api_url = os.environ['API_URL'] 

while True:  
  time.sleep(200)
  print("Run invalidate cache request")
  requests.get(api_url + '/beanies?invalidate_cache=true')
  requests.get(api_url + '/facemasks?invalidate_cache=true')
  requests.get(api_url + '/gloves?invalidate_cache=true')
  