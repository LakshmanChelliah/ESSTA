(function () {
  const canvas = document.querySelector('.globe-canvas');
  if (!canvas) return;

  const wrap = canvas.closest('.globe-wrap');
  const loadingEl = wrap ? wrap.querySelector('.globe-loading') : null;
  const fallbackEl = wrap ? wrap.querySelector('.globe-fallback') : null;

  const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

  // ISO 3166-1 numeric ids used by world-atlas
  const SRI_LANKA_ID = '144';
  const DESTINATION_IDS = {
    '124': 'Canada',
    '840': 'USA',
    '276': 'Germany',
    '36': 'Australia'
  };

  // [longitude, latitude]
  const ORIGIN = [80.77, 7.87]; // Sri Lanka
  const DESTINATIONS = [
    { name: 'Canada', coords: [-106, 56] },
    { name: 'USA', coords: [-98, 39] },
    { name: 'Germany', coords: [10.4, 51.1] },
    { name: 'Australia', coords: [134, -25] }
  ];

  // Theme colors
  const COLOR_OCEAN = '#3a0d14';
  const COLOR_LAND = '#9a6b3f';
  const COLOR_LAND_STROKE = 'rgba(58, 13, 20, 0.55)';
  const COLOR_GRATICULE = 'rgba(232, 212, 139, 0.12)';
  const COLOR_SPHERE_STROKE = 'rgba(232, 212, 139, 0.45)';
  const COLOR_SRI_LANKA = '#e3342f';
  const COLOR_DEST = '#e8d48b';
  const COLOR_ARC = '#f3c64a';

  let d3Lib = null;
  let topojsonLib = null;

  function whenLibsReady(retries) {
    if (window.d3 && window.topojson) {
      d3Lib = window.d3;
      topojsonLib = window.topojson;
      init();
      return;
    }
    if (retries <= 0) {
      showFallback();
      return;
    }
    setTimeout(function () {
      whenLibsReady(retries - 1);
    }, 150);
  }

  function showFallback() {
    if (loadingEl) loadingEl.hidden = true;
    if (canvas) canvas.style.display = 'none';
    if (fallbackEl) fallbackEl.hidden = false;
  }

  function init() {
    const d3 = d3Lib;
    const topojson = topojsonLib;
    const context = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
    const path = d3.geoPath(projection, context);
    const graticule = d3.geoGraticule10();

    let land = null;
    let borders = null;
    let countries = [];

    // Direct great-circle (flight path) arcs from origin to each destination
    const arcs = DESTINATIONS.map(function (d) {
      return {
        name: d.name,
        target: d.coords,
        interpolate: d3.geoInterpolate(ORIGIN, d.coords)
      };
    });

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const size = Math.max(240, Math.min(rect.width, 560));
      width = size;
      height = size;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scale = size / 2 - 4;
      projection.scale(scale).translate([width / 2, height / 2]);
    }

    function isVisible(coords) {
      const r = projection.rotate();
      const center = [-r[0], -r[1]];
      return d3.geoDistance(coords, center) < Math.PI / 2 - 0.02;
    }

    function project(coords) {
      return projection(coords);
    }

    function drawArc(arc, headFraction) {
      // Build a partial great-circle line up to headFraction (0..1)
      const steps = 48;
      const upto = Math.max(1, Math.floor(steps * headFraction));
      const line = { type: 'LineString', coordinates: [] };
      for (let i = 0; i <= upto; i++) {
        line.coordinates.push(arc.interpolate(Math.min(1, (i / steps))));
      }
      context.beginPath();
      path(line);
      context.strokeStyle = COLOR_ARC;
      context.lineWidth = 1.8;
      context.globalAlpha = 0.9;
      context.stroke();
      context.globalAlpha = 1;

      // Moving head dot
      const headCoord = arc.interpolate(Math.min(1, headFraction));
      if (isVisible(headCoord)) {
        const p = project(headCoord);
        if (p) {
          context.beginPath();
          context.arc(p[0], p[1], 3, 0, 2 * Math.PI);
          context.fillStyle = '#fff';
          context.fill();
        }
      }
    }

    function drawMarker(coords, label, color, radius) {
      if (!isVisible(coords)) return;
      const p = project(coords);
      if (!p) return;

      // pulse ring
      context.beginPath();
      context.arc(p[0], p[1], radius + 3, 0, 2 * Math.PI);
      context.strokeStyle = color;
      context.globalAlpha = 0.5;
      context.lineWidth = 1.2;
      context.stroke();
      context.globalAlpha = 1;

      // dot
      context.beginPath();
      context.arc(p[0], p[1], radius, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();

      // label
      if (label) {
        context.font = '600 12px "Source Sans 3", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.lineWidth = 3;
        context.strokeStyle = 'rgba(58, 13, 20, 0.85)';
        context.strokeText(label, p[0], p[1] - radius - 5);
        context.fillStyle = '#fff';
        context.fillText(label, p[0], p[1] - radius - 5);
      }
    }

    function render(arcProgress) {
      context.clearRect(0, 0, width, height);

      // Sphere / ocean
      context.beginPath();
      path({ type: 'Sphere' });
      context.fillStyle = COLOR_OCEAN;
      context.fill();

      // Graticule
      context.beginPath();
      path(graticule);
      context.strokeStyle = COLOR_GRATICULE;
      context.lineWidth = 0.6;
      context.stroke();

      // Land
      if (land) {
        context.beginPath();
        path(land);
        context.fillStyle = COLOR_LAND;
        context.fill();
        context.beginPath();
        path(borders);
        context.strokeStyle = COLOR_LAND_STROKE;
        context.lineWidth = 0.5;
        context.stroke();
      }

      // Destination countries highlighted in gold
      countries.forEach(function (c) {
        if (DESTINATION_IDS[c.id]) {
          context.beginPath();
          path(c);
          context.fillStyle = 'rgba(232, 212, 139, 0.55)';
          context.fill();
        }
      });

      // Sri Lanka highlighted in red (drawn slightly enlarged via marker too)
      countries.forEach(function (c) {
        if (c.id === SRI_LANKA_ID) {
          context.beginPath();
          path(c);
          context.fillStyle = COLOR_SRI_LANKA;
          context.fill();
        }
      });

      // Arcs
      arcs.forEach(function (arc) {
        drawArc(arc, arcProgress);
      });

      // Destination markers
      DESTINATIONS.forEach(function (d) {
        drawMarker(d.coords, d.name, COLOR_DEST, 3.5);
      });

      // Origin marker (Sri Lanka) on top
      drawMarker(ORIGIN, 'Sri Lanka', COLOR_SRI_LANKA, 4.5);

      // Sphere outline
      context.beginPath();
      path({ type: 'Sphere' });
      context.strokeStyle = COLOR_SPHERE_STROKE;
      context.lineWidth = 1.2;
      context.stroke();
    }

    // Load world data, then start
    fetch(WORLD_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load world data');
        return res.json();
      })
      .then(function (world) {
        land = topojson.feature(world, world.objects.countries);
        countries = land.features.map(function (f) {
          return { type: 'Feature', id: String(f.id), geometry: f.geometry };
        });
        borders = topojson.mesh(world, world.objects.countries, function (a, b) {
          return a !== b;
        });

        if (loadingEl) loadingEl.hidden = true;
        resize();
        window.addEventListener('resize', resize);

        start();
      })
      .catch(function () {
        showFallback();
      });

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ROTATION_SPEED = 14; // degrees per second
    const ARC_PERIOD = 4500; // ms for arcs to draw and reset

    let rafId = null;
    let running = false;
    let startTime = null;
    let elapsedBase = 0; // animation time accumulated before the last pause

    // A single composed frame for reduced-motion users (no continuous loop).
    function renderStaticFrame() {
      projection.rotate([-40, -15]);
      render(1);
    }

    function frame(now) {
      const t = now || performance.now();
      if (startTime === null) startTime = t;
      const elapsed = elapsedBase + (t - startTime);

      const lambda = (-20 - (elapsed / 1000) * ROTATION_SPEED) % 360;
      projection.rotate([lambda, -12]);

      const arcProgress = (elapsed % ARC_PERIOD) / ARC_PERIOD;
      render(arcProgress);

      rafId = requestAnimationFrame(frame);
    }

    function startAnimation() {
      if (running || prefersReducedMotion) return;
      running = true;
      startTime = null; // rebased on first frame so motion resumes seamlessly
      rafId = requestAnimationFrame(frame);
    }

    function stopAnimation() {
      if (!running) return;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (startTime !== null) {
        elapsedBase += performance.now() - startTime;
        startTime = null;
      }
    }

    // Entry point: honor reduced motion, otherwise animate only while the
    // globe is visible and the tab is active to spare low-power devices.
    function start() {
      if (prefersReducedMotion) {
        renderStaticFrame();
        return;
      }

      startAnimation();

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                startAnimation();
              } else {
                stopAnimation();
              }
            });
          },
          { threshold: 0 }
        );
        io.observe(canvas);
      }

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      });
    }
  }

  whenLibsReady(40);
})();
