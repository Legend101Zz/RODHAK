mapboxgl.accessToken =
  "pk.eyJ1IjoibXJpZ2VzaHRoYWt1ciIsImEiOiJjbDdwdjZ2MG4wbGVmM3JzMzVtb2U1MnJ0In0.nbEGuAgv1N1c-tXDyR7d4g";

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true,
});

const queryString = window.location.pathname.split("p");
console.log(queryString[1], "here");
const url = `https://rodhak11.onrender.com/map${queryString[1]}`;
console.log(url);
function successLocation(position) {
  setupMap([position.coords.longitude, position.coords.latitude]);
}
const response = await fetch(url, { method: "GET" });
const data = await response.json();
console.log(data.data.currentCoordinates);

function errorLocation() {
  setupMap([-2.24, 53.48]);
}

function setupMap(center) {
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: center,
    zoom: 15,
  });

  // const nav = new mapboxgl.NavigationControl();
  // map.addControl(nav);

  // var directions = new MapboxDirections({
  //   accessToken: mapboxgl.accessToken,
  // });

  map.addControl(
    new MapboxDirections({
      accessToken: mapboxgl.accessToken,
    }),
    "top-left"
  );

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [76.5242236, 31.7108516],
        },
        properties: {
          title: "Rodhak",
          description: "Your Current Location",
        },
      },
    ],
  };
  // add markers to map
  for (const feature of geojson.features) {
    // create a HTML element for each feature
    const el = document.createElement("div");
    el.className = "marker";

    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map);
  }

  map.on("load", async () => {
    // Get the initial location of the International Space Station (ISS).
    // const geojson = await getLocation();
    // Add the ISS location as a source.
    map.addSource("iss", {
      type: "geojson",
      data: center,
    });
    // Add the rocket symbol layer to the map.
    map.addLayer({
      id: "iss",
      type: "symbol",
      source: "iss",
      layout: {
        // This icon is a part of the Mapbox Streets style.
        // To view all images available in a Mapbox style, open
        // the style in Mapbox Studio and click the "Images" tab.
        // To add a new image to the style at runtime see
        // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
        "icon-image": "./rodhak.jpeg",
      },
    });

    // Update the source from the API every 2 seconds.
    const updateSource = setInterval(async () => {
      const geojson = await getLocation(updateSource);
      map.getSource("iss").setData(center);
    }, 2000);

    async function getLocation(updateSource) {
      // Make a GET request to the API and return the location of the ISS.
      try {
        const response = await fetch(url, { method: "GET" });
        const data = await response.json();
        console.log(data.data.currentCoordinates);

        // Fly the map to the location.
        map.flyTo({
          center: data.data.currentCoordinates,
          speed: 0.5,
        });
        // Return the location of the ISS as GeoJSON.
        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: data.data.currentCoordinates,
              },
            },
          ],
        };
      } catch (err) {
        // If the updateSource interval is defined, clear the interval to stop updating the source.
        if (updateSource) clearInterval(updateSource);
        throw new Error(err);
      }
    }
  });
}
