/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var apikey = "";
// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Waiting for Fuel Prices ...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

splashWindow.add(text);
splashWindow.show();

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
  color:'black',
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
var options = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10
};

console.log(localStorage.getItem(3));
if (!localStorage.getItem(3) || parseInt(localStorage.getItem(3))===0 || isNaN(localStorage.getItem(3))) {
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


function getFuelPrice(latitude,longitude) {
  var distance = 5;
  var sort = "dist";
  var type = "e5";
  if (localStorage.getItem(1) && localStorage.getItem(2) && localStorage.getItem(4)) {
    distance = localStorage.getItem(1);
    sort = localStorage.getItem(2);
    type = localStorage.getItem(4);
  }
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
    
    // Create an array of Menu items
    menuItems = parseFeed(data);

    showUserData(menuItems,data);
    
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
  console.log(quantity + "items");
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

function showUserData(menuItems,data) {
  // Construct Menu to show to user
var resultsMenu = new UI.Menu({
  sections: [{
    title: 'Current Prices',
    items: menuItems
  }]
});
  resultsMenu.show();
  splashWindow.hide();
  // Add an action for SELECT
  resultsMenu.on('select', function(e) {
    console.log('Item number ' + e.itemIndex + ' was pressed!');
    getDetails(e.itemIndex,data);
  });
} 

Pebble.addEventListener('showConfiguration', function() {
  var url = 'https://pebble.penguinfriends.org/index.html';
  console.log('Showing configuration page: ' + url);
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  var configData = JSON.parse(decodeURIComponent(e.response));
  //console.log('Configuration page returned: ' + JSON.stringify(configData));

  var dict = {};
  dict.distance = parseInt(configData.distance, 10);
  dict.sort = configData.sort;
  dict.postalCode = parseInt(configData.postalCode);
  dict.type = configData.type;
  console.log('dict: ' + JSON.stringify(dict));
    localStorage.setItem(1, dict.distance);  
    localStorage.setItem(2, dict.sort);
    localStorage.setItem(3, dict.postalCode);
    localStorage.setItem(4, dict.type);
});