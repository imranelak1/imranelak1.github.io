import { useEffect, useRef, useState } from "react";
import {
  Viewer,
  ArcGisMapServerImageryProvider,
  OpenStreetMapImageryProvider,
  Cartesian3,
  Cartesian2,
  Color,
  HeadingPitchRange,
  Matrix4,
  BoundingSphere,
  Math as CesiumMath,
  LabelStyle,
  VerticalOrigin,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  Entity,
  Credit,
  Ion,
  ConstantProperty,
  FrameRateMonitor,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { places, findPlace } from "./places";
import type { DayPhase } from "./useMapWeather";
type Props = {
  placeId: string;
  exploring: boolean;
  paused: boolean;
  style: "noir" | "satellite";
  phase: DayPhase;
  cloud: number;
  onSelect: (id: string) => void;
  onStatus: (status: string) => void;
  onPerformanceLimited: () => void;
  command: { type: "in" | "out" | "reset"; tick: number };
};

export default function Globe(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const initialFlight = useRef(false);
  const syncOrbit = useRef(() => {});
  const syncQuality = useRef(() => {});
  useEffect(() => syncOrbit.current(), [props.paused, props.exploring, ready]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false,
      contextFailed = false,
      frame = 0;
    let removeError: (() => void) | undefined;
    let handler: ScreenSpaceEventHandler | undefined;
    let map: Viewer;
    Ion.defaultAccessToken = "";
    try {
      map = new Viewer(container, {
        baseLayer: false,
        baseLayerPicker: false,
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        skyBox: false,
        skyAtmosphere: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        msaaSamples: 1,
        contextOptions: {
          webgl: { alpha: false, antialias: false, preserveDrawingBuffer: false, powerPreference: "low-power" },
        },
      });
    } catch {
      container.replaceChildren();
      latest.current.onStatus(
        "Map unavailable — your portfolio is still here.",
      );
      return;
    }
    viewer.current = map;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    let lowPower = (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) || (memory !== undefined && memory <= 4);
    map.useBrowserRecommendedResolution = true;
    syncQuality.current = () => {
      const exploring = latest.current.exploring;
      // The shaded background needs fewer pixels than the interactive map.
      map.resolutionScale = exploring ? (lowPower ? .8 : 1) : (lowPower ? .55 : .75);
      map.targetFrameRate = exploring ? (lowPower ? 24 : 30) : (lowPower ? 15 : 20);
      map.scene.globe.maximumScreenSpaceError = exploring ? 3 : 5;
      container.dataset.quality = lowPower ? "low" : "standard";
      map.scene.requestRender();
    };
    syncQuality.current();
    map.scene.backgroundColor = Color.fromCssColorString("#0a0a0a");
    map.scene.globe.baseColor = Color.fromCssColorString("#242424");
    map.scene.globe.enableLighting = false;
    map.scene.screenSpaceCameraController.minimumZoomDistance = 180;
    map.scene.screenSpaceCameraController.maximumZoomDistance = 24000000;
    map.scene.screenSpaceCameraController.enableInputs =
      latest.current.exploring;
    map.cesiumWidget.creditDisplay.addStaticCredit(
      new Credit('<a href="https://www.esri.com/">Powered by Esri</a>', true),
    );
    map.camera.setView({
      destination: Cartesian3.fromDegrees(-7.98, 31.63, 750000),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
    });
    for (const place of places.filter((place) => place.precision !== "city")) {
      map.entities.add({
        id: place.id,
        position: Cartesian3.fromDegrees(place.longitude, place.latitude, 25),
        point:
          place.precision === "area"
            ? undefined
            : {
                color: Color.WHITE,
                pixelSize: 7,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Infinity,
              },
        label: {
          text:
            place.precision === "area" ? `${place.name} · area` : place.name,
          font: "12px monospace",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -12),
          disableDepthTestDistance: Infinity,
          show: false,
        },
      });
    }
    handler = new ScreenSpaceEventHandler(map.scene.canvas);
    handler.setInputAction((event: { position: Cartesian2 }) => {
      if (!latest.current.exploring) return;
      const picked = map.scene.pick(event.position);
      if (picked?.id instanceof Entity && places.some(place => place.id === picked.id.id)) latest.current.onSelect(picked.id.id);
    }, ScreenSpaceEventType.LEFT_CLICK);
    let fallback = false;
    let imageryReady = false;
    const useStreetMap = () => {
      if (disposed || fallback) return;
      fallback = true;
      removeError?.();
      map.imageryLayers.removeAll();
      const osm = new OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
        maximumLevel: 18,
      });
      map.imageryLayers.addImageryProvider(osm);
      latest.current.onStatus("Satellite unavailable · street-map fallback");
      removeError = osm.errorEvent.addEventListener(() =>
        latest.current.onStatus(
          "Map tiles unavailable · check your connection",
        ),
      );
      container.dataset.ready = "true";
      setReady(true);
      imageryReady = true;
    };
    latest.current.onStatus("Loading satellite imagery…");
    const timeout = window.setTimeout(() => {
      if (!disposed && !imageryReady) useStreetMap();
    }, 15000);
    ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      { enablePickFeatures: false },
    )
      .then((provider) => {
        if (disposed || fallback) return;
        const layer = map.imageryLayers.addImageryProvider(provider);
        layer.saturation = 1;
        layer.brightness = 1;
        let failures = 0;
        removeError = provider.errorEvent.addEventListener(() => {
          if (++failures >= 3) useStreetMap();
        });
        latest.current.onStatus("Satellite imagery");
        imageryReady = true;
      })
      .catch(useStreetMap)
      .finally(() => {
        clearTimeout(timeout);
        if (disposed) return;
        container.dataset.ready = "true";
        setReady(true);
      });
    const onLost = (event: Event) => {
      event.preventDefault();
      contextFailed = true;
      map.useDefaultRenderLoop = false;
      syncOrbit.current();
      latest.current.onStatus("Map unavailable — reload to retry.");
    };
    map.scene.canvas.addEventListener("webglcontextlost", onLost);
    const onVisibility = () => {
      map.useDefaultRenderLoop = !document.hidden && !contextFailed;
      syncOrbit.current();
      if (!document.hidden) map.scene.requestRender();
    };
    document.addEventListener("visibilitychange", onVisibility);
    // Sample actual scene updates, with a warmup and hidden-tab handling.
    // A slow machine gets a smaller buffer; ambient motion pauses once, and
    // the visitor can resume it with the existing Motion control.
    const monitor = new FrameRateMonitor({
      scene: map.scene,
      samplingWindow: 3,
      quietPeriod: 3,
      warmupPeriod: 5,
      minimumFrameRateDuringWarmup: 6,
      minimumFrameRateAfterWarmup: 12,
    });
    let motionAdapted = false, performanceStruggling = false;
    monitor.lowFrameRate.addEventListener(() => {
      lowPower = true;
      performanceStruggling = true;
      syncQuality.current();
      syncOrbit.current();
    });
    monitor.nominalFrameRate.addEventListener(() => { performanceStruggling = false; });
    let last = performance.now();
    const canOrbit = () => !contextFailed && !document.hidden && !latest.current.exploring && !latest.current.paused;
    const orbit = (now: number) => {
      frame = 0;
      if (!canOrbit()) return;
      frame = window.setTimeout(() => orbit(performance.now()), lowPower ? 100 : 1000 / 15);
      const dt = Math.min((now - last) / 1000, 0.2);
      last = now;
      if (
        contextFailed ||
        document.hidden ||
        latest.current.exploring ||
        latest.current.paused ||
        !initialFlight.current
      )
        return;
      const target = findPlace(latest.current.placeId);
      map.camera.lookAt(
        Cartesian3.fromDegrees(target.longitude, target.latitude),
        new HeadingPitchRange(
          map.camera.heading + dt * 0.006,
          CesiumMath.toRadians(-58),
          target.range,
        ),
      );
      map.camera.lookAtTransform(Matrix4.IDENTITY);
      map.scene.requestRender();
    };
    syncOrbit.current = () => {
      clearTimeout(frame); frame = 0;
      // A slowdown first detected while exploring still applies on return.
      if (performanceStruggling && !motionAdapted && canOrbit()) {
        motionAdapted = true;
        latest.current.onPerformanceLimited();
        container.dataset.orbiting = "false";
        return;
      }
      container.dataset.orbiting = String(canOrbit());
      last = performance.now();
      if (canOrbit()) frame = window.setTimeout(() => orbit(performance.now()), 1000 / 15);
    };
    syncOrbit.current();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      clearTimeout(frame);
      syncOrbit.current = () => {};
      syncQuality.current = () => {};
      monitor.destroy();
      removeError?.();
      handler?.destroy();
      document.removeEventListener("visibilitychange", onVisibility);
      map.scene.canvas.removeEventListener("webglcontextlost", onLost);
      if (!map.isDestroyed()) map.destroy();
      viewer.current = null;
      initialFlight.current = false;
    };
  }, []);
  useEffect(() => {
    const map = viewer.current;
    if (!map || !ready) return;
    const place = findPlace(props.placeId);
    initialFlight.current = false;
    if (host.current) delete host.current.dataset.target;
    map.camera.cancelFlight();
    const complete = () => {
      initialFlight.current = true;
      if (host.current) host.current.dataset.target = props.placeId;
    };
    const options = {
      offset: new HeadingPitchRange(
        CesiumMath.toRadians(20),
        CesiumMath.toRadians(-58),
        place.range,
      ),
      duration: props.paused ? 0 : 2.2,
      complete,
      cancel: () => {},
    };
    map.camera.flyToBoundingSphere(
      new BoundingSphere(
        Cartesian3.fromDegrees(place.longitude, place.latitude),
        0,
      ),
      options,
    );
    map.scene.requestRender();
  }, [props.placeId, ready]);
  useEffect(() => {
    const map = viewer.current;
    if (!map) return;
    map.scene.screenSpaceCameraController.enableInputs = props.exploring;
    syncQuality.current();
    map.entities.values.forEach((entity) => {
      if (entity.label)
        entity.label.show = new ConstantProperty(props.exploring);
    });
    for (let i = 0; i < map.imageryLayers.length; i++) {
      const layer = map.imageryLayers.get(i);
      layer.saturation = props.style === "satellite" ? 1.15 - props.cloud * 0.35 : 0;
      layer.brightness = (props.phase === "night" ? 0.57 : props.phase === "sunset" ? 0.95 : 1.1) * (1 - props.cloud * 0.18);
      layer.contrast = props.phase === "night" ? 1.15 : 1.04;
    }
    map.scene.requestRender();
  }, [props.exploring, props.style, props.phase, props.cloud, ready]);
  useEffect(() => {
    const map = viewer.current;
    if (!map || !ready || !props.command.tick) return;
    if (props.command.type === "in")
      map.camera.zoomIn(map.camera.positionCartographic.height * 0.35);
    if (props.command.type === "out")
      map.camera.zoomOut(map.camera.positionCartographic.height * 0.5);
    if (props.command.type === "reset") {
      const place = findPlace(props.placeId);
      map.camera.flyToBoundingSphere(
        new BoundingSphere(
          Cartesian3.fromDegrees(place.longitude, place.latitude),
          0,
        ),
        {
          offset: new HeadingPitchRange(
            0,
            CesiumMath.toRadians(-58),
            place.range,
          ),
          duration: props.paused ? 0 : 1.5,
        },
      );
    }
    map.scene.requestRender();
  }, [props.command, ready]);
  return (
    <div
      ref={host}
      className="globe-canvas"
      aria-label="Interactive satellite map"
    />
  );
}
