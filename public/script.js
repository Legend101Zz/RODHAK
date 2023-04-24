mapboxgl.accessToken =
  "pk.eyJ1IjoibXJpZ2VzaHRoYWt1ciIsImEiOiJjbDdwdjZ2MG4wbGVmM3JzMzVtb2U1MnJ0In0.nbEGuAgv1N1c-tXDyR7d4g";

const queryString = window.location.pathname.split("p");
console.log(queryString[1], "here");
const url = `https://rodhak11.onrender.com/himraahi/map${queryString[1]}`;
console.log(url);

try {
  setInterval(() => {
    fetch(url, { method: "GET" })
      .then(async (response) => {
        const data1 = await response.json();
        console.log(response, data1);
        setupMap(
          data1.data.currentCoordinates,
          data1.data.Start,
          data1.data.End
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }, 10000);
} catch (error) {
  console.log("There was an error", error);
}

function setupMap(center, start, end) {
  console.log(center);
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/navigation-night-v1",
    center: center,
    zoom: 15,
  });
  console.log(map);

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: center,
        },
        properties: {
          title: "Rodhak",
          description: "Driver's Current Location",
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
    new mapboxgl.Marker(el)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }) // add popups
          .setHTML(
            `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
          )
      )
      .addTo(map);
  }

  const route = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "metric",
    controls: {
      instructions: false,
      inputs: false,
    },
    interactive: false,
    congestion: true,
  });

  route.setOrigin(start);
  route.setDestination(end);

  map.addControl(route, "top-left");
}
