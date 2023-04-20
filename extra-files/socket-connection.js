const options = {
  enableHighAccuracy: true,
  timeout: 10000,
};
const id = navigator.geolocation.watchPosition(
  successCallback,
  errorCallback,
  options
);

module.exports = id;
