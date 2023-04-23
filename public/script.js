mapboxgl.accessToken =
  "pk.eyJ1IjoibXJpZ2VzaHRoYWt1ciIsImEiOiJjbDdwdjZ2MG4wbGVmM3JzMzVtb2U1MnJ0In0.nbEGuAgv1N1c-tXDyR7d4g";

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true,
});

const queryString = window.location.pathname.split("p");
console.log(queryString[1], "here");
const url = `http://localhost:3000/himraahi/map${queryString[1]}`;
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
    style: "mapbox://styles/mapbox/navigation-night-v1",
    center: center,
    zoom: 15,
  });

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

  map.addControl(route, "top-left");

  map.on("load", async () => {
    map.addSource("iss", {
      type: "geojson",
      data: center,
    });

    //add image

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: data.data.currentCoordinates,
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

    //add directions

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      controls: { instructions: false, interactive: false },
    });

    map.addControl(directions, "top-left");

    directions.setOrigin(data.data.Start);
    directions.setDestination(data.data.End);
    const nav = new mapboxgl.NavigationControl();

    map.addControl(nav);

    map.addLayer({
      id: "iss",
      type: "symbol",
      source: "iss",
      layout: {
        "icon-image": "{marker-symbol}-15",
        "text-field": "{title}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0.6],
        "text-anchor": "top",
      },
    });

    // Update the source from the API every 2 seconds.
    const updateSource = setInterval(async () => {
      const geojson = await getLocation(updateSource);
      map.getSource("iss").setData(center);
    }, 2000);

    async function getLocation(updateSource) {
      // Make a GET request to the API and return the location of the Driver
      try {
        const response = await fetch(url, { method: "GET" });
        const data = await response.json();
        console.log(data, data.data.currentCoordinates);

        // Fly the map to the location.
        map.flyTo({
          center: data.data.currentCoordinates,
          speed: 0.5,
        });
        // Return the location of the driver as GeoJSON.
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
