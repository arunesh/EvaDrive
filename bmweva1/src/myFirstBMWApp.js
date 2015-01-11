var MojioClient, 
    config, 
    mojio_client, 
    App, 
    Vehicle, 
    Event,
    Observer, 
    observer;
var myFirebaseRef = new Firebase("https://glaring-fire-9730.firebaseio.com/");

MojioClient = this.MojioClient;
portNumber = window.location.protocol == "https:" ? 443 : 80;
theScheme = window.location.protocol == "https:" ? 'https' : 'http';

config = {
    application: 'c2df634f-ba5b-4c02-bbd7-ac4cc545c9e5',    // Restricted app
    secret: '3ceeb219-4ef8-4c65-b196-046762bbfcfe',         // Production sandbox
    hostname: 'data.api.hackthedrive.com',
    version: 'v1',
    port: '443',
    scheme: 'https',
};

mojio_client = new MojioClient(config);

var username = 'bmweva1', 
    pwd = 'Giridhar082', 
    isLogin = false;
var apps, vehicles;

(function() {
    console.log("loging invoked")
    if (!isLogin) {
        console.log("loging invoked2")
        mojio_client.login(username, pwd, function(error, result) {
            console.log("loging invoked3")
            console.log(error)
            console.log(result)
            if (error) {
                $("#loginResult").append("Login error: " + error);
            } else {
                isLogin = true;
                user = result;
                $("#loginResult").append('Logged in as user ' + username + '<br><br>');
                $("#loginResult").append('Logged in successfully<br>');
                $("#loginResult").append('UserId: ' + user.UserId + '<br>');
                $("#loginResult").append('ValidUntil: ' + user.ValidUntil + '<br>');
                App = mojio_client.model("App");
                Vehicle = mojio_client.model("Vehicle");
                Observer = mojio_client.model("Observer");
                Event = mojio_client.model("Event");
                showApps();
                showVehicles();
            }
        });
    }
}).call(this);

function showApps() {
    mojio_client.get(App, {}, function(error, result) {
        var str = "";
        if (error) {
            $("#resultDiv").html("Get Apps error: " + error);
        } else {
            apps = mojio_client.getResults(App, result);

            // display the app results
            displayResults(apps, "mySelect", "#resultDiv", "App list - select one and press 'Listen' for updates", "App list - No App found");
        }
    });
}

function showVehicles() {
    mojio_client.get(Vehicle, {}, function(error, result) {
        if (error) {
            $("#resultDiv2").html("Get Vehicle error: " + error);
        } else {
            vehicles = mojio_client.getResults(Vehicle, result);

            // display the vehicles in a listbox
            displayResults(vehicles, "mySelect2", "#resultDiv2", "Vehicle list - select one and press 'Listen' for updates", "Vehicle list - No vehicle found");
        }
    });
}

function displayResults(items, selectList, div, titleMsg, notFoundMsg) {
    var length = items.length;
    var mySelect = document.getElementById(selectList);
    mySelect.size = length;
    $(div).empty();

    if (length > 0) {
        $(div).html('<p>' + titleMsg + '</p>');
        for (var i = 0; i < length; i++) {
            var option = document.createElement("option");
            option.text = items[i].Name;
            option.value = i;
            mySelect.options.add(option);
        }
    } else {
        $(div).html('<p>' + notFoundMsg + '</p>');
    }
}

function listenApp() {
    var list = document.getElementById("mySelect");
    var strId = "#listenAppDiv";
    var observedEntity;
    var changedCallback = function (entity) {
        $(strId).append('<p>Observed App change:</p>');
        $(strId).append(entity.Name + '<br>' + entity.Description + '<br>');
        unobserve(observedEntity, strId);
    };

    $(strId).empty();
    if (list.selectedIndex > -1) {
        observedEntity = new App(apps[list.selectedIndex]);
        $(strId).append('<p>Observe for the App: ' + observedEntity.Name + '</p>');

        mojio_client.observe(observedEntity, null, changedCallback, function(error, result) {
            if (error) {
                $(strId).append("Observe error: " + error);
            } else {
                observer = result;
                //artificial change in order to observe events
                $(strId).append("Current App Description: " + observedEntity.Description);
                observedEntity.Description = "Changed to something random [" + Math.random() + "]";
                setTimeout(function() {
                    mojio_client.put(observedEntity, function(error, result) {
                        if (error) {
                            $(strId).append("<br>App changed error: " + error);
                        } else {
                            var app = new App(result);
                            apps[list.selectedIndex] = app;
                            $(strId).append("<br>App description changed successfully to: " + app.Description);
                        }
                    });
                }, 1000);
            }
        });
    } else {
        $(strId).append("please select an item from the list first");
    }
}

function listenVehicle() {
    var list = document.getElementById("mySelect2");
    var strId = "#listenVehicleDiv";
    var observedEntity;
    var speed_val, lat_val, lng_val, battery_level_var, battery_charging_time_var;    
    var changedCallback = function (entity) {
        var event1;
        event1 = new Event(entity);

        $(strId).append('<p>Received vehicle event for ' + event1.EventType + '</p>');
        console.log(event1)

        if (event1.EventType == "Accident" ||
            event1.EventType == "TripStatus" ||
            event1.EventType == "AttentionAssistant" ||
            (event1.EventType == "BatteryCharging" && event1.ChargingStatus == "Charging")) {
            console.log(event1.EventType);
            speed_val = (event1.Speed == null ? 0 : event1.Speed);    
            lat_val = (event1.Location.Lat == null ? 0 : event1.Location.Lat);
            lng_val = (event1.Location.Lng == null ? 0 : event1.Location.Lng);
            battery_level_var = (event1.BatteryLevel == null ? 0 : event1.BatteryLevel);
            battery_charging_time_var = (event1.ChargingTime == null ? 0 : event1.ChargingTime);
            myFirebaseRef.push({event_type: event1.EventType,
                                lat: lat_val,
                                lng: lng_val,
                                speed: speed_val,
                                battery_level: battery_level_var,
                                battery_charging_time: battery_charging_time_var,
                                timestamp: event1.Time,
                                vehicleId: event1.VehicleId            
                              });
        }
    };

    $(strId).empty();
    if (list.selectedIndex > -1) {
        observedEntity = new Vehicle(vehicles[list.selectedIndex]);
        $(strId).append('<p>Observe for the Vehicle: ' + observedEntity.Name + '</p>');
        mojio_client.observe(Event, observedEntity, changedCallback, function(error, result) {
            if (error) {
                $(strId).append("Observe error: " + error);
            } else {
                observer = result;
                $(strId).append('<p>You can simulate vehicle events on the Vehicle Simulator</p>');
            }
        });
    } else {
        $(strId).append("please select an item from the list first");
    }
}

function unobserve(observedEntity, strId) {
    mojio_client.unobserve(observer, observedEntity, null, function(error, result) {
        if (error) {
            $(strId).append('<p>Unobserve error: ' + error + '</p>');
        } else {
            $(strId).append('<p>Unobserved the entity: ' + observedEntity.Name + '</p>');
        }
    });
}
