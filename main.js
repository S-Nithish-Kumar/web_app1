// Get references to UI elements
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');

log("hello");
// Connect to the device on Connect button click
connectButton.addEventListener('click', function() {
  connect();
});

// Disconnect from the device on Disconnect button click
disconnectButton.addEventListener('click', function() {
  disconnect();
});

// Handle form submit event
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form sending
  send(inputField.value); // Send text field contents
  inputField.value = '';  // Zero text field
  inputField.focus();     // Focus on text field
});

// Selected device object cache
let deviceCache = null;

// Launch Bluetooth device chooser and connect to the selected
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

function requestBluetoothDevice() {
    log('Requesting bluetooth device...');
  
    return navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001809-0000-1000-8000-00805f9b34fb'] // Required to access service later.
    }).
        then(device => {
          log('"' + device.name + '" bluetooth device selected');
          deviceCache = device;
  
          return deviceCache;
        });
  }

  // Characteristic object cache
let characteristicCache = null;

// Connect to the device specified, get service and characteristic
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect().
      then(server => {
        log('GATT server connected, getting service...');

        return server.getPrimaryService(0x1809);
      }).
      then(service => {
        log('Service found, getting characteristic...');

        return service.getCharacteristic(0x2A1C);
      }).
      then(characteristic => {
        log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
      });
}

// Enable the characteristic changes notification
function startNotifications(characteristic) {
    log('Starting notifications...');
  
    return characteristic.startNotifications().
        then(() => {
          log('Notifications started');
          // Added line
          characteristic.addEventListener('characteristicvaluechanged',
              handleCharacteristicValueChanged);
        });
  }

// Data receiving
function handleCharacteristicValueChanged(event) {
    //let value = new TextDecoder().decode(event.target.value);
    
    log(dataViewToHex(event.target.value), 'in');
  }

function dataViewToHex(dataView) {
    log("I am in");
    let hex = '';
    for (let i = 0; i < dataView.byteLength; i++) {
        const byte = dataView.getUint8(i);
        hex += ('0' + byte.toString(16)).slice(-2); // Ensure two-digit representation
    }
    return hex.toUpperCase(); // Optionally convert to uppercase
}

function disconnect() {
if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
    deviceCache.gatt.disconnect();
    log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
    log('"' + deviceCache.name +
        '" bluetooth device is already disconnected');
    }
}

characteristicCache = null;
deviceCache = null;
}

// Output to terminal
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}