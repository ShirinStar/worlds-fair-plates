Vue.use(VTooltip);

let data = null;
let scroller;

document.addEventListener('DOMContentLoaded', () => {}, false);

function map(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  if (start2 < stop2) {
    return this.constrain(newval, start2, stop2);
  } else {
    return this.constrain(newval, stop2, start2);
  }
}

function imageUrl(listing) {
  return 'static/' + listing.image.replace('listing_images/', '');
}

function thumbnail(listing) {
  return 'static/' + listing.image.replace('listing_images/', '') + '.thumb.jpg';
}

const Home = {
  template: '#home',
  delimiters: ['${', '}'],
  data: function() {
    return {
      plates: [],
      listings: [],
      plate: null,
      loading: false
    };
  },

  created: function() {
    this.loadPlates();
  },

  updated: function() {
    scroller = new SweetScroll(
      {
        vertical: false,
        horizontal: true
      },
      '.plate-container'
    );
  },

  methods: {
    loadPlates: function() {
      if (data) {
        if (this.plates.length == 0) this.plates = data;
        return true;
      }

      this.loading = true;
      fetch('/plates?listings=true&listing_limit=500')
        .then(response => {
          return response.json();
        })
        .then(json => {
          this.plates = json;
          data = json;
          this.loading = false;
          scroller = new SweetScroll(
            {
              vertical: true,
              horizontal: true
            },
            '.plate-container'
          );
        })
        .catch(ex => {
          console.log('parsing failed', ex);
        });
    },

    imageUrl: imageUrl,
    thumbnail: thumbnail,

    listStyle: function(listing) {
      if (this.showMap) {
        //50, -125
        //21, 65
        // let x = map(listing.lng, -180, 180, 0, 100);
        // let y = map(listing.lat, -90, 90, 0, 100);
        let x = map(listing.lng, -125, 50, 0, 1000);
        let y = map(listing.lat, 21, 50, 1000, 0);
        // let x = (listing.lng * 1000)/360;
        // let y = (listing.lat * 1000)/180;
        let style = {
          // position: 'absolute',
          // left: `${x}%`,
          // top: `${y}%`,
          transform: `translate(${x}px, ${y}px)`
          // width: '20px',
          // display: listing.lat ? 'block' : 'none',
          // border: '1px solid #000',
        };
        console.log(style);
        return style;
      } else {
        return {};
      }
    },

    startHover: function(e) {
      e.target.play();
      // e.target.loop();
    },

    endHover: function(e) {
      e.target.pause();
      e.target.currentTime = 0;
    },

    goLeft: function(e) {
      e.preventDefault();
      scroller.to('-=' + window.innerWidth);
    },

    goRight: function(e) {
      e.preventDefault();
      scroller.to('+=' + window.innerWidth);
    }
  }
};

const MapPage = {
  template: '#map-page',
  delimiters: ['${', '}'],
  data: function() {
    return {
      plates: [],
      plate: null,
      listings: [],
      loading: false,
      accessToken: "pk.eyJ1Ijoic3BsYXZpZ25lIiwiYSI6ImNpejFzZGx2NDAxbW0zM21uaGE5czI2cWkifQ.6p_ecnp-5wUHJeRm0kxKxQ",
      mapStyle: "MAP_STYLE", // your map style
    };
  },

  created: function() {
    this.loadPlates();
  },

  mounted: function() {
    this.makeMap();
    console.log('made map');
  },

  methods: {
    loadPlates: function() {
      console.log('loading');
      if (data) {
        if (this.plates.length == 0) this.plates = data;
        this.setListings();
        return true;
      }

      this.loading = true;
      fetch('/plates?listings=true&listing_limit=1000')
        .then(response => {
          return response.json();
        })
        .then(json => {
          this.plates = json;
          data = json;
          this.setListings();
          this.loading = false;
          console.log('loaded');
        })
        .catch(ex => {
          console.log('parsing failed', ex);
        });
    },

    setListings: function() {
      let listings = this.plates.map(p => p.listings);
      listings = [].concat.apply([], listings);
      console.log(listings);
      this.listings = listings;

      let addToMap = () => {
        if (this.mapbox) {
          listings.forEach((l) => {
            var el = document.createElement('img');
            el.className = 'marker';
            el.src = this.thumbnail(l);
            // el.addEventListener('click', (e) => {
            //   console.log(e);
            // });

            // make a marker for each feature and add to the map
            new mapboxgl.Marker(el)
              .setLngLat([l.lng, l.lat])
              .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML('<h3>' + l.title + '</h3><p>' + l.location + '</p>'))
              .addTo(this.mapbox);
          });
        } else {
          setTimeout(addToMap, 200);
        }
      }
      let timer = setTimeout(addToMap, 200);
    },

    makeMap: function() {
      mapboxgl.accessToken = this.accessToken;
      this.mapbox = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-96, 37.8],
        zoom: 3
      });
    },

    imageUrl: imageUrl,
    thumbnail: thumbnail,
  }
};

const PlatePage = {
  template: '#plate-page',
  delimiters: ['${', '}'],

  data: function() {
    return {
      listings: [],
      id: null,
      title: '',
      description: '',
      image: null
    };
  },

  created: function() {
    this.loadPlate();
    // this.plate = data.find(p => p.id == this.$route.params.id);
    // console.log(this.plate);
    // this.loadListings();
  },

  methods: {
    loadPlate: function() {
      this.loading = true;

      fetch('/plates/' + this.$route.params.id)
        .then(response => {
          return response.json();
        })
        .then(json => {
          this.listings = json.listings;
          this.id = json.id;
          this.title = json.title;
          this.description = json.description;
          this.image = json.image;
          this.loading = false;
        })
        .catch(ex => {
          console.log('parsing failed', ex);
        });
    },
    imageUrl: imageUrl,
    thumbnail: thumbnail
  }
};

const NotPlates = {
  template: '#not-plates',
  delimiters: ['${', '}'],
  data: function() {
    return {
      listings: []
    };
  },

  created: function() {
    this.loadListings();
  },

  methods: {
    loadListings() {
      fetch('/listings?notplates=true')
        .then(response => {
          return response.json();
        })
        .then(json => {
          this.listings = json;
        })
        .catch(ex => {
          console.log('parsing failed', ex);
        });
    },
    thumbnail: thumbnail
  }
};

const Plate = {
  template: '#plate',
  delimiters: ['${', '}']
};

const Listing = {
  template: '#listing',
  delimiters: ['${', '}']
};

const Welcome = {
  template: '#welcome',
  delimiters: ['${', '}']
};

const Info = {
  template: '#info',
  delimiters: ['${', '}']
};

const routes = [
  {
    path: '/',
    component: Welcome
  },
  {
    path: '/plates',
    name: 'plates',
    component: Home
  },
  {
    path: '/map',
    name: 'map-page',
    component: MapPage
  },
  {
    path: '/info',
    name: 'info',
    component: Info
  },
  {
    path: '/notplates',
    name: 'not-plates',
    component: NotPlates
  },
  {
    path: '/plate/:id',
    name: 'plate-page',
    component: PlatePage
  },
  {
    path: '/listing/:id',
    name: 'listing',
    component: Listing
  }
];

const router = new VueRouter({
  routes // short for `routes: routes`
});

new Vue({
  router,
  el: '#app',
  delimiters: ['${', '}'],
  data: {}
});
