/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Waiting for Fuel Prices ... If nothing happens please visit Settings',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

function success(pos) {
    var latitude = pos.coords.latitude;
    var longitude = pos.coords.longitude;
    
    getFuelPrice(latitude,longitude);
}

function error(err) {
  console.log('location error (' + err.code + '): ' + err.message);
}

/* ... */

// Choose options about the data returned
var options = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10000
};

// Request current position
console.log(localStorage.getItem(3));
if (!localStorage.getItem(3) || parseInt(localStorage.getItem(3))===0) {
  console.log("bla");
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
  var sort = "price";
  if (localStorage.getItem(1) && localStorage.getItem(2)) {
    distance = localStorage.getItem(1);
    sort = localStorage.getItem(2);
  }
  var URL = 'https://creativecommons.tankerkoenig.de/json/list.php' + "?lat=" + latitude + "&lng=" + longitude + "&rad=" + distance + "&sort=" + sort + "&type=e10&apikey=";
  ajax(
  {
    url: URL,
    type: 'json'
  },
  function(data) {
    // Success!
    var menuItems = [];
    console.log('Successfully fetched fuel prices!' + JSON.stringify(data));
    if (typeof(data.stations[0])==='undefined') {
      console.log("Nothing to return");
      return 0;
    }
    
    // Create an array of Menu items
    menuItems = parseFeed(data, 5);

    // Check the items are extracted OK
    for(var i = 0; i < menuItems.length; i++) {
        console.log(menuItems[i].title + ' | ' + menuItems[i].subtitle) ;
    }
    showUserData(menuItems,data);
    
  },
  function(error) {
    // Failure!
    console.log('Failed fetching fuel prices: ' + error);
  }
);
  
}

function parseFeed(data, quantity) {
  var items = [];
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
    content = data.stations[index].postCode + " " + data.stations[index].place + " " + data.stations[index].street + " " + data.stations[index].houseNumber;
  }
  var detailCard = new UI.Card({
    title:'Details',
    subtitle:data.stations[index].name,
    body: content
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
  console.log('Configuration page returned: ' + JSON.stringify(configData));

  var dict = {};
  dict.distance = parseInt(configData.distance, 10);
  dict.sort = configData.sort;
  dict.postalCode = parseInt(configData.postalCode);
  console.log('dict: ' + JSON.stringify(dict));
    localStorage.setItem(1, dict.distance);  
    localStorage.setItem(2, dict.sort);
    localStorage.setItem(3, dict.postalCode);
 
});