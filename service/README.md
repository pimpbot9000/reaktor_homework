# 4-ratikka-service
Node Express service that gives departure times of tram 4 at Munkkiniemi (heading to Isoo Kirkko) at three different stops. Data is real-time, fetched from the HSL api (i.e data is not provided by magic fairies).

You can find this as a Docker container in [DockerHub](https://hub.docker.com/r/pimpbot9000/4-tram-service).

## Usage

Simply:
```
docker run -it <host_port>:3000 4-tram-service
```
...starts the service. There are no logs or anything.

## But... I'm an old fashioned guy and I don't get what's the deal with Docker

In that case, 
```
npm start 
```
in root of the project does the trick.

If you type in these magic words in terminal
```
npm run dev
```
the service starts in developer mode which restarts the server every time you bang CTRL+S when coding like crazy.

There are three resources at the service, since there are three tram stops in Munkkiniemi.
```
api/portti
api/alepa
api/paattari
```
## Example query result:
```
[
  {
    "departureInMinutes": 5,
    "departureInSeconds": 293,
    "description": "Katajanokka via Meilahti",
    "sign": "Katajanokka",
    "route": "4"
  },
  {
    "departureInMinutes": 12,
    "departureInSeconds": 713,
    "description": "Katajanokka via Meilahti",
    "sign": "Katajanokka",
    "route": "4"
  },
  {
    "departureInMinutes": 20,
    "departureInSeconds": 1193,
    "description": "Katajanokka via Meilahti",
    "sign": "Katajanokka",
    "route": "4"
  },
  {
    "departureInMinutes": 27,
    "departureInSeconds": 1613,
    "description": "Katajanokka via Meilahti",
    "sign": "Katajanokka",
    "route": "4"
  },
  {
    "departureInMinutes": 35,
    "departureInSeconds": 2093,
    "description": "Töölön halli via Meilahti",
    "sign": "Töölön halli",
    "route": "4H"
  }
]
```
## That's awesome! Where can I see it in action?!

Glad you asked! Project is currently hosted at [Heroku](https://tram-4-service.herokuapp.com/api/alepa). Patience my young padawan. It's asleep but she'll wake up.

## Superb! What else you got up in your sleeve?

It'd be a damn shame to leave such a great service without demand! I also made a neat Android app that displays the information. [Here](https://github.com/pimpbot9000/tram4app) one can find the the project in Github. Go and bask in awe.

Sure the official HSL provides the same functionality but it's slow and somewhat annoying to use if you're in a hurry. Nelosen spora app offers a lightweight remedy.
