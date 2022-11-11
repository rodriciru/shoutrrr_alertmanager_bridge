# shoutrrr alertmanager bridge

A basic alertmanager bridge to shoutrrr.

Maybe, this should be writen in go, but i never do anything in that language, so i use js.

Created by modifying code from https://github.com/aTable/ntfy_alertmanager_bridge

It sends a `shoutrrr send` command PER ALERT, so if in one request you have 4 alerts, it will send 4 times


This bridge receives data in [this format](https://prometheus.io/docs/alerting/latest/notifications/#alert) in the [alertmanager webhook config](alertmanager/alertmanager/config.yml):

```sh
...
receivers:
  - name: "shoutrrr-servers"
    webhook_configs:
      - url: http://shoutrrr_alertmanager_bridge:30000/shoutrrr_alert/<serviceName>?<shoutrrrParams>
        send_resolved: true
        max_alerts: 0
...
```
`shoutrrrParams` will be added to the shoutrrr service URL automatically

You also need to create a file with your services, and other whit Handlebars templates and pass them to Docker in these 2 vars:
```sh
environment:
  - SERVICES_CONFIG=/etc/s_a_b/services.json
  - TEMPLATES_PATH=/etc/s_a_b/templates/
```
or better, mount a volume in `/etc/s_a_b/` with services.json and template folder

Services.json file expect a JSON Array with your configuration for shoutrrr services:

```sh
[
    {
        "name": "Give_me_a_cool_name_please",
        "url": "shoutrrr_url_from_service",
        "template": "cooltemplatename.hbs",
        "replaceInURL": [
            {
                "shoutrrrProp": "Subject",
                "by": "fingerprint",
                "byAlert": true
            }
        ]
    }
    ...
]
```
You need to give a name, which will be used in your receiver's URL from alertmanager.

Also, you have to put a shoutrrr service URL, the name of the template, and if you want, you can replace dynamically some values in the shoutrrr service URL. byAlert means look in every alert, and not in the JSON posted

The [docker-compose.yml](docker-compose.yml) contains a prometheus+alertmanager+shoutrrr_alertmanager_bridge+gotify if you want to run the stack as is. Or if you want to pull just the shoutrrr_alertmanager_bridge simply add to your docker-compose.yml:

```sh
...

  shoutrrr_alertmanager_bridge:
    image: ghcr.io/rodriciru/shoutrrr_alertmanager_bridge:main
    container_name: shoutrrr_alertmanager_bridge
    ports:
      - 30000:30000
    volumes:
      - ./s_a_b/:/etc/s_a_b/
    #environment:
      #- SERVICES_CONFIG=/etc/s_a_b/services.json
      #- TEMPLATES_PATH=/etc/s_a_b/templates/

...
```

In `.hbs` template you can prefix variable with `reqBody.`. In this case, this value comes from the JSON posted to [alert manager](https://prometheus.io/docs/alerting/latest/configuration/#webhook_config). If no reqBody is find, it will asumme is from the current alert. See [templateName.hbs](s_a_b/templates/templateName.hbs) or [gotify.hbs](s_a_b/templates/gotify.hbs)

Services.json file expect a JSON Array with your configuration for shoutrrr services:

```sh
[
    {
        "name": "Give_me_a_cool_name_please",
        "url": "shoutrrr_url_from_service",
        "template": "cooltemplatename.hbs",
        "replaceInURL": [
            {
                "shoutrrrProp": "Subject",
                "by": "fingerprint",
                "byAlert": true
            }
        ]
    }
    ...
]
```

Do note this is just a prototype, it works FOR ME, but maybe for you, it works as well.

I accept pull request, or any improvements.

## Development

```sh
docker-compose up
```