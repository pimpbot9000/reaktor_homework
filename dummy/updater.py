import time, requests, os

api_url = os.environ['API_URL'] 

while True:
  
  time.sleep(100)
  print("Run invalidate cache request")
  requests.get(api_url + '/beanies?invalidate_cache=true')