mapboxgl.accessToken =
  "pk.eyJ1IjoibXJpZ2VzaHRoYWt1ciIsImEiOiJjbDdwdjZ2MG4wbGVmM3JzMzVtb2U1MnJ0In0.nbEGuAgv1N1c-tXDyR7d4g";

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true,
});

function successLocation(position) {
  console.log(position, "here location");
  setupMap([position.coords.longitude, position.coords.latitude]);
}

function errorLocation(err) {
  const exact = document.getElementById("speed");
  exact.innerHTML = "There was some error in accesing your current location ";
  setupMap([77.108923, 31.957897]);
}

const url = `https://rodhak11.onrender.com/himraahi/trips`;
// const url = "https://api.wheretheiss.at/v1/satellites/25544";
console.log(url);

// try {
//   fetch(url, { method: "GET" })
//     .then(async (response) => {
//       const data1 = await response.json();
//       console.log(response, data1);
//       const center = [data1.longitude, data1.latitude];
//       setupMap(data1.data.currentCoordinates, data1.data.Start, data1.data.End);
//       // setupMap(center);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// } catch (error) {
//   console.log("There was an error", error);
// }

function setupMap(center) {
  console.log(center);
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/navigation-day-v1",
    center: center,
    zoom: 5,
  });

  map.on("load", async () => {
    // Update the source from the API every 2 seconds.
    setInterval(async () => {
      await getLocation();
      async function getLocation() {
        // Make a GET request to the API and return the location of the Bus.
        try {
          const response = await fetch(url, { method: "GET" });
          const data = await response.json();
          const buses = data.data;

          //   map.flyTo({
          //     center: [
          //       data.data[1].currentCoordinates[0],
          //       data.data[1].currentCoordinates[1],
          //     ],
          //     speed: 0.5,
          //   });
          //   console.log(buses, "here__indata");
          //   const BusCoords = buses.map((result) => result.currentCoordinates);
          //   const BusStart = buses.map((result) => result.Start);
          //   const BusEnd = buses.map((result) => result.End);
          // console.log(BusCoords, BusStart, BusEnd);

          // Return the location of the Bus as GeoJSON.

          for (let i = 0; i < buses.length; i++) {
            if (buses[i].currentCoordinates[0]) {
              console.log(
                "for__LOOP_DATA",
                buses[i],
                buses[i].currentCoordinates,
                `Buses${i + 1}`
              );
              map.addSource(`Buses${i + 1}`, {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: buses[i].currentCoordinates,
                      },
                      properties: {
                        title: buses[i].Vehicle,
                        start: buses[i].Start,
                        end: buses[i].End,
                      },
                    },
                  ],
                },
              });
              let bus = map.getSource(`Buses${i + 1}`)._data;
              console.log("check__22", bus);
              for (const feature of bus.features) {
                // create a HTML element for each feature
                const el = document.createElement("div");
                el.className = "marker";

                // make a marker for each feature and add to the map
                new mapboxgl.Marker(el)
                  .setLngLat(feature.geometry.coordinates)
                  .setPopup(
                    new mapboxgl.Popup({ offset: 25 }) // add popups
                      .setHTML(
                        `<h3>${feature.properties.title}</h3><br/><p>From: ${feature.properties.start}</p><p>To: ${feature.properties.end}</p> ,`
                      )
                  )
                  .addTo(map);
              }
            } else {
              continue;
            }
            console.log(map.getSource("Buses2"));
          }
        } catch (err) {
          // If the updateSource interval is defined, clear the interval to stop updating the source.
          // if (updateSource) clearInterval(updateSource);
          // throw new Error(err);
        }
      }
    }, 2000);
  });
}
