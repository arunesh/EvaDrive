BMWClient = @BMWClient

# make sure you record your redirect_uri on your production account's app record in the developer center.
config = {
    application: '[YOUR APP ID GOES HERE]',
    redirect_uri: '[YOUR REDIRECT URI GOES HERE]',
    hostname: 'data.api.hackthedrive.com',
    version: 'v1',
    port: '80',
    scheme: 'http',
};

bmw_client = new BMWClient(config)
App = bmw_client.model('App')
$( () ->

    if (config.application == '[YOUR APP ID GOES HERE]')
        div = document.getElementById('result')
        div.innerHTML += 'BMW Error:: Set your application and secret keys in myFirstBMWApp source code.  <br>'
        return
    if (config.application == '[YOUR REDIRECT URI GOES HERE]')
        div = document.getElementById('result')
        div.innerHTML += 'BMW Error:: Set a redirect_uri in myFirstBMWApp source code.  <br>'
        return

    bmw_client.token((error, result) ->
        if (error)
            console.log("redirecting to login.")
            bmw_client.authorize(config.redirect_uri)
        else
            alert("Authorization Successful.")
            div = $("#welcome");
            div.html('Authorization Result:<br />')
            div.append(JSON.stringify(result))

            bmw_client.get(bmw_client.model("User"), {id: result.UserId}, (error, result) ->
                message = '<br/><br/>Viewing the location of <strong>'

                if (result.FirstName)
                    message += result.FirstName
                else if (result.UserName)
                    message += result.UserName
                else if (result.LastName)
                    message += result.LastName
                else if (result.Email)
                    message += result.Email
                else
                    message += "Unknown"

                message += '</strong>'

                div = $("#welcome")
                div.append(message)
            )

            bmw_client.get(bmw_client.model("Vehicle"), {}, (error, result) ->
                lat = []; lng = []; i = 0

                $.each(result.Data, (key, value) ->
                    if (value.LastLocation? and value.LastLocation.Lat? and value.LastLocation.Lng?)
                        lat[i] = value.LastLocation.Lat
                        lng[i] = value.LastLocation.Lng
                        i++
                )

                div = $("#result")
                if (lat.length > 0)
                    div.html('The vehicle is at: ' + lat[0] + ", " + lng[0])
                    buildMap(lat[0], lng[0]);
                else
                    div.html("No vehicle detected!");
            )
    )
    $("#button").click( () ->
        bmw_client.unauthorize(config.redirect_uri)
    )
)


buildMap = (lat, lng) ->
    # Initialize Map
    map = new GMaps (
        {
            el: '#map',
            lat: lat,
            lng: lng,
            panControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            overviewMapControl: false,
        }
    )

    #Add the marker
    setTimeout( () ->
        map.addMarker (
            {
                lat: lat,
                lng: lng,
                animation: google.maps.Animation.DROP,
                draggable: false,
                title: 'Current Location'
            }
        ),
        1000
    )
