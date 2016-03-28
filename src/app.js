// Requires
var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

// ApiKey
var apikey = "";

// Prepare the accelerometer
Accel.init();

// GPS Options
var options = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
};

// Show splash screen while waiting for data
var splashWindow = new UI.Window({ fullscreen: true });

// Loading Screen
var startImage = new UI.Image({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  image: 'images/startScreen.png',
});

// Show StartScreen
splashWindow.add(startImage);
splashWindow.show();

// Start App
entryPoint();

function entryPoint() {
  //Initialise App on first start
  if (!localStorage.getItem(1) && !localStorage.getItem(2) && !localStorage.getItem(3) && !localStorage.getItem(4)) {
    localStorage.setItem(1, 5);
    localStorage.setItem(2, "price");
    localStorage.setItem(3, 0);
    localStorage.setItem(4, "e5");
  }
  
  if (parseInt(localStorage.getItem(3))===0 || isNaN(localStorage.getItem(3))) {
     navigator.geolocation.getCurrentPosition(success, error, options);
  } else {
    var postalCode = localStorage.getItem(3);
      var gmaps = "http://maps.google.com/maps/api/geocode/json?components=country:DE|postal_code:" + postalCode;
      ajax (
        {
        url: gmaps,
        type: 'json'
        },
        function(gdata) {
        // Success!        
          var longitude = gdata.results[0].geometry.location.lng;
          var latitude = gdata.results[0].geometry.location.lat;
          console.log('Successfully fetched coordinates!' + longitude + " " + latitude);
          getFuelPrice(latitude,longitude);
      
        },
        function(error) {
          // Failure!
        console.log('Failed fetching fuel prices: ' + error);
        }
  );
  }

  function success(pos) {
      var latitude = pos.coords.latitude;
      var longitude = pos.coords.longitude;
      
      getFuelPrice(latitude,longitude);
  }
  
  function error(err) {
    console.log('location error (' + err.code + '): ' + err.message);
    var failure = new UI.Window();
    var text = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(144, 168),
    text:'Failed to get GPS data. Please see Settingspage.',
    font:'GOTHIC_28_BOLD',
    color:'blue',
    textOverflow:'wrap',
    textAlign:'center',
    backgroundColor:'white'
    });
  
    failure.add(text);
    failure.show();
    splashWindow.hide();
  }
  
  /* ... */
  
  // Choose options about the data returned
}

function getFuelPrice(latitude,longitude) {
  var distance = localStorage.getItem(1);
  var sort = localStorage.getItem(2);
  var type = localStorage.getItem(4);

  var URL = 'https://creativecommons.tankerkoenig.de/json/list.php' + "?lat=" + latitude + "&lng=" + longitude + "&rad=" + distance + "&sort=" + sort + "&type=" + type + "&apikey=" + apikey;
  ajax(
  {
    url: URL,
    type: 'json'
  },
  function(data) {
    // Success!
    var menuItems = [];
    if (typeof(data.stations[0])==='undefined') {
      console.log("Nothing to return");
      var failure = new UI.Window();
      var text = new UI.Text({
          position: new Vector2(0, 0),
          size: new Vector2(144, 168),
          text:'Load failed. Please visit Settinspage.',
          font:'GOTHIC_28_BOLD',
          color:'black',
          textOverflow:'wrap',
          textAlign:'center',
          backgroundColor:'white'
      });

      failure.add(text);
      failure.show();
      splashWindow.hide();
      return 0;
    }
    data.stations.splice(10);
    // Create an array of Menu items
    menuItems = parseFeed(data);

    showUserData(menuItems,data,type,distance);
    
  },
  function(error) {
    // Failure!
    console.log('Failed fetching fuel prices: ' + error);
  }
);
  
}

function parseFeed(data) {
  var items = [];
  var quantity = data.stations.length;
  console.log(quantity + " items");
  for(var i = 0; i < quantity; i++) {
    var name = "";
    if (!data.stations[i].brand) {
       name = data.stations[i].name;
    } else {
       name = data.stations[i].brand;
    }
    var title = data.stations[i].price + "€ " + name;
    // Add to menu items array
    var address = data.stations[i].dist + "km | " + data.stations[i].place + " " + data.stations[i].street;
    items.push({
      title:title,
      subtitle:address
    });
  }
 
  // Finally return whole array
  return items;
}

function getDetails(index,data) {
  console.log(data.stations.length);
  var content = "No details available";
  if (data.stations[index].brand) {
    content = data.stations[index].dist + "km | " + data.stations[index].postCode + " " + data.stations[index].place + " " + data.stations[index].street + " " + data.stations[index].houseNumber;
  }
  var detailCard = new UI.Card({
    title:'Details',
    subtitle:data.stations[index].name,
    body: content,
    scrollable:true
  });
  detailCard.show();

}

function showUserData(menuItems,data,type,distance,postalCode) {
  
  // Construct Menu to show to user
  var gps = "GPS: on";
  if (localStorage.getItem(3)!==0 && !(isNaN(localStorage.getItem(3)))) {
    gps = localStorage.getItem(3);
  }  
var resultsMenu = new UI.Menu({
  sections: [{
    title: type.charAt(0).toUpperCase() + type.slice(1) + ' - ' + gps + ' - Radius: ' + distance + 'km',
    items: menuItems
  }]
});
  resultsMenu.show();

  splashWindow.hide();
    // Notify the user
  Vibe.vibrate('short');
  
  // Register for 'tap' events
  resultsMenu.on('accelTap', function(e) {
    console.log('TAP!');
    console.log('axis: ' + e.axis + ', direction:' + e.direction);
    entryPoint();

  });
  // Add an action for SELECT
  resultsMenu.on('select', function(e) {
    console.log('Item number ' + e.itemIndex + ' was pressed!');
    getDetails(e.itemIndex,data);
  });
} 

Pebble.addEventListener('showConfiguration', function() {
  var sort = localStorage.getItem(2);
  var distance = localStorage.getItem(1);
  var type = localStorage.getItem(4);
  var postalCode = localStorage.getItem(3);
  
  
  var configData = '{"distance":'+ distance +',"sort":"'+ sort +'","postalCode":' + postalCode + ',"type":"' + type + '"}';
  
  
  var url = 'https://pebble.penguinfriends.org/configurable.html#' + encodeURIComponent(JSON.stringify(configData));
  console.log('Showing configuration page: ' + url);
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  var configData = JSON.parse(decodeURIComponent(e.response));
  console.log('Configuration page returned: ' + JSON.stringify(configData));

  var dict = {};
  dict.distance = parseInt(configData.distance, 10);
  dict.sort = configData.sort;
  dict.postalCode = parseInt(configData.postalCode);
  dict.type = configData.type;
  console.log('dict: ' + JSON.stringify(dict));
  localStorage.setItem(1, dict.distance);  
  localStorage.setItem(2, dict.sort);
  if (dict.postalCode && !(isNaN(dict.postalCode))) {
    localStorage.setItem(3, dict.postalCode);
  } else {
    localStorage.setItem(3,0);
  }
  localStorage.setItem(4, dict.type);
});