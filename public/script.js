mapboxgl.accessToken = mapId;

const queryString = window.location.pathname.split("p");
console.log(queryString[1], "here");
const url = `https://rodhak11.onrender.com/himraahi/map${queryString[1]}`;
// const url = "https://api.wheretheiss.at/v1/satellites/25544";
console.log(url);

try {
  fetch(url, { method: "GET" })
    .then(async (response) => {
      const data1 = await response.json();
      console.log(response, data1);
      const centerForTest = [data1.longitude, data1.latitude];

      setupMap(data1.data.currentCoordinates, data1.data.Start, data1.data.End);
      // setupMap(centerForTest);
      // setupMap(center);
    })
    .catch((err) => {
      console.log(err);
    });
} catch (error) {
  console.log("There was an error", error);
}

function setupMap(center) {
  console.log(center);
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: center,
    zoom: 15,
  });

  map.on("load", async () => {
    // Get the initial location of the Bus;
    const geojson = await getLocation();
    // Add the Bus location as a source.

    map.loadImage("/car.png", (error, image) => {
      if (error) throw error;

      // Add the image to the map style.
      map.addImage("busNew", image);
      console.log(image);
      // Add a layer to use the image to represent the data.
      map.addSource("busNew", {
        type: "geojson",
        data: geojson,
      });

      // Add the rocket symbol layer to the map.
      map.addLayer({
        id: "buses",
        type: "symbol",
        source: "busNew",
        layout: {
          "icon-image": "bus",
          "icon-size": 2.25,
        },
      });
    });

    // Update the source from the API every 2 seconds.
    const updateSource = setInterval(async () => {
      const geojson = await getLocation(updateSource);
      map.getSource("busNew").setData(geojson);
      console.log(map, map.getSource("busNew"));
    }, 2000);

    async function getLocation(updateSource) {
      // Make a GET request to the API and return the location of the Bus.
      try {
        const response = await fetch(url, { method: "GET" });
        const data = await response.json();
        console.log(data);
        // Fly the map to the location of bus.
        map.flyTo({
          center: [
            data.data.currentCoordinates[0],
            data.data.currentCoordinates[1],
            // data.longitude,
            // data.latitude,
          ],
          speed: 0.5,
        });
        // Return the location of the Bus as GeoJSON.
        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  data.data.currentCoordinates[0],
                  data.data.currentCoordinates[1],
                  // data.longitude,
                  // data.latitude,
                ],
              },
              properties: {
                title: "Rodhak",
                description: "Driver's Current Location",
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
