import type { Anchor, MotionContext } from "../context";
import { $, cssVar, lerpK, smoothRange } from "../utils";

/** Section pose: x/y are fractions of the half-viewport, s = scale, shell = glass opacity, op = ring opacity, ex = core expansion. */
export interface Pose {
  x: number;
  y: number;
  s: number;
  shell: number;
  op: number;
  ex: number;
}

/** A pose the intro drives directly. full = skip the entrance scale-up; rate = easing rate toward it. */
export interface IntroPose extends Pose {
  full?: number;
  rate?: number;
}

export type Stage = ReturnType<typeof createScene3D>;

// three.js is fetched once and shared; preloadThree() starts it early (the design preloads it in <head>)
let threeLoad: Promise<[typeof import("three"), typeof import("three/examples/jsm/utils/BufferGeometryUtils.js")]> | null = null;
export const preloadThree = () => (threeLoad ??= Promise.all([import("three"), import("three/examples/jsm/utils/BufferGeometryUtils.js")]));

/**
 * 3D stage: one fixed WebGL canvas behind the page. A glass shell (design) wrapped around a wire core (code),
 * orbit rings, dust and a parallax galaxy. Scroll moves it between one pose per section: it becomes the sun
 * of the skills orbit, a distant beacon on the trajectory, peels away to the bare structure in About and
 * parks in the footer's event horizon. During the intro it sits centre stage while the stars warp in.
 * three.js is loaded on demand so it never blocks first paint; until then (or without WebGL) the CSS
 * poster orb stands in.
 */
export function createScene3D(ctx: MotionContext) {
  const { root } = ctx;
  const canvas = $<HTMLCanvasElement>(".gl3d");
  // resolves after the first frame is drawn (or on failure), so the intro can start on a ready stage
  let markReady: () => void = () => {};
  const ready = new Promise<void>((r) => (markReady = r));
  let pendingWarp: { v: number; hold: boolean } | null = null;
  // stage controls; real implementations are installed once the scene exists
  const ctl = {
    startIntro: () => {},
    warp: (v: number) => void v,
    snap: (p: IntroPose) => void p,
    // warp settings made before the scene exists are queued and applied when it starts
    setWarp: (v: number, hold: boolean) => void (pendingWarp = { v, hold }),
    release: () => void (pendingWarp && (pendingWarp.hold = false)),
    heroPose: (): IntroPose | null => null,
  };
  // pose the intro publishes; it can be set before the scene loads so the first frame already uses it
  let introOverride: IntroPose | null = null;
  // Setup is split into small steps that each yield until after the next painted frame, so building the
  // stage in the background never blocks the intro's animation for long.
  const nextTask = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

  preloadThree()
    .then(async ([THREE, { mergeVertices }]) => {
      if (!ctx.flags.alive) return;
      // User Timing marks (visible in DevTools > Performance) for each setup step
      const mark = (n: string) => performance.mark("gl:" + n);
      mark("three-loaded");

      const PINK = new THREE.Color(cssVar("--accent", "#ff4d8d")),
        AMBER = new THREE.Color(cssVar("--accent-2", "#ffb547")),
        INK = new THREE.Color(cssVar("--text", "#f6f0f4")),
        BG = new THREE.Color(cssVar("--bg", "#0b0810")),
        VIOLET = new THREE.Color(cssVar("--violet", "#6a3df0"));

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
      } catch {
        console.warn("WebGL unavailable, poster fallback");
        markReady();
        return;
      }
      renderer.setClearColor(BG, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mark("renderer");
      // if the engine is torn down mid-setup, release the GL context straight away
      const bail = () => {
        renderer.dispose();
        renderer.forceContextLoss();
      };
      await nextTask();
      if (!ctx.flags.alive) return bail();

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 9);

      /* studio env built from emissive panels in the brand colours: pink key, amber fill, ink strip */
      {
        const env = new THREE.Scene();
        env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: BG.clone().multiplyScalar(0.6), side: THREE.BackSide })));
        const panel = (c: InstanceType<typeof THREE.Color>, k: number, w: number, h: number, p: [number, number, number], r?: number) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(k), side: THREE.DoubleSide }));
          m.position.set(...p);
          m.lookAt(0, 0, 0);
          if (r) m.rotateZ(r);
          env.add(m);
        };
        panel(PINK, 6, 6, 9, [-7, 2, 4]);
        panel(AMBER, 5, 5, 7, [7, -3, 2]);
        panel(INK, 9, 14, 0.6, [0, 8, 2], 0.2);
        panel(INK, 3, 0.5, 10, [3, 0, 8]);
        panel(PINK, 2.5, 8, 3, [0, -8, -4]);
        const pm = new THREE.PMREMGenerator(renderer);
        scene.environment = pm.fromScene(env, 0.035).texture;
        pm.dispose();
      }
      mark("environment");
      await nextTask();
      if (!ctx.flags.alive) return bail();

      const rig = new THREE.Group(),
        spin = new THREE.Group();
      rig.add(spin);
      scene.add(rig);

      /* glass shell: vertices are displaced every frame from a copy of the rest positions */
      const shellGeo = mergeVertices(new THREE.IcosahedronGeometry(1.25, 18));
      const base = Float32Array.from(shellGeo.attributes.position.array);
      const shellMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.03,
        transmission: 1,
        thickness: 0.9,
        ior: 1.5,
        dispersion: 3,
        iridescence: 1,
        iridescenceIOR: 1.35,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        attenuationColor: PINK.clone().lerp(INK, 0.6),
        attenuationDistance: 3.5,
        envMapIntensity: 1.3,
        transparent: true,
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      spin.add(shell);

      /* wire core: the structure you can see through the surface */
      const core = new THREE.Group();
      const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
      // edges as thin emissive struts (GL lines are 1px), so the structure reads at any size
      const edgeGeo = new THREE.EdgesGeometry(coreGeo),
        ep = edgeGeo.attributes.position,
        nE = ep.count / 2;
      const wireMat = new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 0.8, roughness: 0.4 });
      const wire = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0075, 0.0075, 1, 6, 1, true), wireMat, nE);
      {
        const a = new THREE.Vector3(),
          b = new THREE.Vector3(),
          m = new THREE.Matrix4(),
          q = new THREE.Quaternion(),
          up = new THREE.Vector3(0, 1, 0),
          s = new THREE.Vector3();
        for (let i = 0; i < nE; i++) {
          a.fromBufferAttribute(ep, i * 2);
          b.fromBufferAttribute(ep, i * 2 + 1);
          const d = b.clone().sub(a);
          s.set(1, d.length(), 1);
          q.setFromUnitVectors(up, d.normalize());
          m.compose(a.clone().add(b).multiplyScalar(0.5), q, s);
          wire.setMatrixAt(i, m);
        }
      }
      const nodesMat = new THREE.PointsMaterial({ color: INK, size: 0.07, sizeAttenuation: true });
      const nodes = new THREE.Points(mergeVertices(coreGeo.clone().deleteAttribute("normal").deleteAttribute("uv")), nodesMat);
      const inner = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshStandardMaterial({ color: PINK, emissive: PINK, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.2, flatShading: true }),
      );
      core.add(wire, nodes, inner);
      spin.add(core);

      /* orbit rings */
      const ringMat = (c: InstanceType<typeof THREE.Color>, o: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o });
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.006, 8, 220), ringMat(PINK, 0.9));
      const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.004, 8, 220), ringMat(AMBER, 0.6));
      ringA.rotation.set(1.2, 0.3, 0);
      ringB.rotation.set(-0.9, 0.6, 0.4);
      rig.add(ringA, ringB);

      mark("orb-built");
      await nextTask();
      if (!ctx.flags.alive) return bail();

      /* dust for depth */
      const dust = (() => {
        const n = 420,
          p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const r = 3 + Math.random() * 9,
            a = Math.random() * 6.283,
            b = Math.acos(2 * Math.random() - 1);
          p.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a) * 0.7, r * Math.cos(b) - 3], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(p, 3));
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: INK, size: 0.025, transparent: true, opacity: 0.45, depthWrite: false }));
        scene.add(pts);
        return pts;
      })();

      /* galaxy: soft nebula clouds and two twinkling star layers; each layer scrolls at its own depth so content floats over it */
      const isMob = () => innerWidth <= 700,
        isTab = () => innerWidth <= 1100;
      const galaxy: { obj: InstanceType<typeof THREE.Object3D>; k: number; uT?: { value: number } }[] = [];
      {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const x = c.getContext("2d")!;
        const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,.55)");
        g.addColorStop(0.6, "rgba(255,255,255,.12)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const neb = new THREE.Group();
        scene.add(neb);
        galaxy.push({ obj: neb, k: 0.0011 });
        const clouds: [InstanceType<typeof THREE.Color>, number, number, number, number, number, number][] = [
          [VIOLET, -9, 2, 22, 14, 0.22, 0.3], [PINK, 10, -4, 18, 12, 0.14, -0.4], [AMBER, 6, -14, 16, 9, 0.08, 0.6],
          [VIOLET, -6, -22, 26, 12, 0.2, -0.2], [PINK, 9, -32, 20, 14, 0.15, 0.5], [VIOLET, -2, -44, 34, 10, 0.18, 0.15],
          [AMBER, -10, -52, 14, 10, 0.07, -0.6], [PINK, 4, -62, 24, 16, 0.16, 0.2], [VIOLET, 0, -74, 30, 18, 0.22, -0.1],
        ];
        clouds.forEach(([col, px, py, sx, sy, o, rot]) => {
          const m = new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: o * 0.62, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, rotation: rot });
          const s = new THREE.Sprite(m);
          s.position.set(px, py, -24);
          s.scale.set(sx, sy, 1);
          neb.add(s);
        });
        const starMat = () =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: { uT: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
            vertexShader:
              "attribute float aS; attribute float aP; attribute vec3 aC; uniform float uT; uniform float uPR; varying float vA; varying vec3 vC;" +
              "void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uPR * (40.0 / -mv.z);" +
              " vA = 0.45 + 0.55 * (0.5 + 0.5 * sin(uT * (0.6 + aP * 0.25) + aP * 6.283)); vC = aC; }",
            fragmentShader:
              "varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); float a = smoothstep(0.5, 0.0, r); a *= a; gl_FragColor = vec4(vC * a * vA, a * vA); }",
          });
        const layer = (n: number, z: number, spreadX: number, top: number, bottom: number, size: number, k: number) => {
          const p = new Float32Array(n * 3),
            s = new Float32Array(n),
            ph = new Float32Array(n),
            cl = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            p.set([(Math.random() * 2 - 1) * spreadX, top - Math.random() * (top - bottom), z + (Math.random() - 0.5) * 4], i * 3);
            const big = Math.random() < 0.06;
            s[i] = size * (big ? 2.4 : 0.5 + Math.random());
            ph[i] = Math.random();
            const r = Math.random(),
              c = r < 0.72 ? INK : r < 0.86 ? PINK : r < 0.95 ? AMBER : VIOLET;
            cl.set([c.r, c.g, c.b], i * 3);
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.BufferAttribute(p, 3));
          g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
          g.setAttribute("aP", new THREE.BufferAttribute(ph, 1));
          g.setAttribute("aC", new THREE.BufferAttribute(cl, 3));
          const mat = starMat();
          const pts = new THREE.Points(g, mat);
          pts.frustumCulled = false;
          scene.add(pts);
          galaxy.push({ obj: pts, k, uT: mat.uniforms.uT });
        };
        layer(isMob() ? 880 : 1760, -30, 30, 12, -110, 3.4, 0.0016);
        layer(isMob() ? 300 : 560, -12, 14, 7, -60, 2.6, 0.0028);
      }

      mark("galaxy-built");
      await nextTask();
      if (!ctx.flags.alive) return bail();

      const key = new THREE.PointLight(PINK, 30, 20);
      key.position.set(-3, 2, 4);
      scene.add(key);
      const fill = new THREE.PointLight(AMBER, 18, 20);
      fill.position.set(3, -2, 3);
      scene.add(fill);

      /* choreography: one pose per section; orbit and foot poses follow screen anchors published by those scenes */
      // pose that puts the orb (shell radius 1.25) exactly over an anchor; hh = half view height at the rig depth
      const anchorPose = (a: Anchor, op: number): Pose => {
        const w = innerWidth,
          h = innerHeight,
          hh = Math.tan(THREE.MathUtils.degToRad(16)) * 9;
        return { x: (a.x - w / 2) / (w / 2), y: -(a.y - h / 2) / (h / 2), s: (a.d * hh) / (1.25 * h), shell: 1, op, ex: 0 };
      };
      const POSES: Record<string, () => Pose> = {
        hero: () =>
          isMob() ? { x: 0.42, y: 0.18, s: 0.39, shell: 1, op: 0.85, ex: 0 } : isTab() ? { x: 0.42, y: 0.25, s: 0.9, shell: 1, op: 0.9, ex: 0 } : { x: 0.34, y: 0.02, s: 1.08, shell: 1, op: 1, ex: 0 },
        orbit: () => (ctx.anchors.orbit ? anchorPose(ctx.anchors.orbit, 0.65) : { x: 0.4, y: 0, s: 0.6, shell: 1, op: 1, ex: 0 }),
        traj: () => (isMob() ? { x: 0.78, y: 0.78, s: 0.16, shell: 0.7, op: 0.6, ex: 0.3 } : { x: 0.86, y: 0.7, s: 0.2, shell: 0.7, op: 0.6, ex: 0.3 }),
        hello: () => (isMob() ? { x: 0.4, y: 0.5, s: 0.55, shell: 0, op: 0.9, ex: 1 } : { x: 0.62, y: 0.05, s: 0.95, shell: 0, op: 1, ex: 1 }),
        foot: () => (ctx.anchors.foot ? anchorPose(ctx.anchors.foot, 1) : { x: 0.5, y: 0, s: 0.4, shell: 1, op: 1, ex: 0 }),
      };
      // while the intro plays and before it publishes a pose: a point at the centre (the tagline intro blooms it later)
      const introPoseOf = (): Pose => ({ x: 0, y: 0, s: 0.001, shell: 1, op: 1, ex: 0 });
      const SECS = (
        [
          ["hero", ".hero"],
          ["orbit", ".orbit"],
          ["traj", ".traj"],
          ["hello", ".hello"],
          ["foot", ".foot"],
        ] as const
      )
        .map(([k, s]) => ({ k, el: document.querySelector(s) }))
        .filter((o): o is { k: (typeof o)["k"]; el: Element } => !!o.el);

      // scroll position at which each section's pose is fully reached
      let marks: { k: string; c: number }[] = [];
      const measure = () => {
        const w = innerWidth,
          h = innerHeight,
          dpr = Math.min(devicePixelRatio || 1, isMob() ? 1.5 : 1.75);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const maxY = document.documentElement.scrollHeight - h;
        marks = SECS.flatMap((o, i) => {
          const r = o.el.getBoundingClientRect(),
            top = r.top + scrollY;
          // pinned scenes hold their pose for the whole pinned run
          if (o.el.hasAttribute("data-scene"))
            return [
              { k: o.k, c: Math.min(maxY, top) },
              { k: o.k, c: Math.min(maxY, top + r.height - h) },
            ];
          const c = i === 0 ? 0 : i === SECS.length - 1 ? maxY : Math.min(maxY, top + r.height / 2 - h / 2);
          return [{ k: o.k, c }];
        });
      };
      ctx.measureFns.add(measure);
      measure();

      const L = (a: number, b: number, t: number) => a + (b - a) * t;
      let introPose = false;
      const target = (y: number) => {
        introPose = !!root.dataset.intro;
        if (introPose && introOverride) {
          const { full, rate, ...pose } = introOverride;
          void full;
          void rate;
          return { pose: pose as Pose, beat: 0 };
        }
        if (introPose) return { pose: introPoseOf(), beat: 0 };
        let i = 0;
        while (i < marks.length - 1 && y >= marks[i + 1].c) i++;
        const a = marks[i],
          b = marks[i + 1] || a;
        const t = b === a ? 0 : smoothRange(0.18, 0.82, (y - a.c) / Math.max(1, b.c - a.c));
        const A = POSES[a.k](),
          B = POSES[b.k]();
        const o = {} as Pose;
        (Object.keys(A) as (keyof Pose)[]).forEach((k) => (o[k] = L(A[k], B[k], t)));
        return { pose: o, beat: t < 0.5 ? i : i + 1 };
      };

      const motionOn = () => root.dataset.motion === "on";
      const first = target(scrollY);
      const cur: Pose = { ...first.pose };
      const P = { x: 0, y: 0, tx: 0, ty: 0, cx: null as number | null, cy: 0, near: 0 };
      let enter = motionOn() ? 0 : 1,
        lastY = scrollY,
        vel = 0,
        clock = 0,
        sv = 0,
        smoothY = scrollY,
        // star "warp" (1 -> 0): the galaxy rushes in at intro start
        warp = root.dataset.intro ? 1 : 0;
      let warpHold = false;
      ctl.startIntro = () => {
        enter = 0;
        warp = 1;
      };
      // transitions / the contact console kick the stars without cutting a stronger warp short
      ctl.warp = (v) => {
        warp = Math.max(warp, v);
      };
      // instant snap to a pose, no easing, no entrance scale
      ctl.snap = (p) => {
        (Object.keys(cur) as (keyof Pose)[]).forEach((key) => {
          if (key in p) cur[key] = p[key];
        });
        enter = 1;
      };
      ctl.setWarp = (v, hold) => {
        warp = v;
        warpHold = hold;
      };
      ctl.release = () => {
        warpHold = false;
      };
      ctl.heroPose = () => ({ ...POSES.hero(), full: 1 });
      if (introOverride?.full) enter = 1;
      if (pendingWarp) {
        warp = pendingWarp.v;
        warpHold = pendingWarp.hold;
      }
      ctx.on(
        window,
        "pointermove",
        (e: PointerEvent) => {
          P.tx = (e.clientX / innerWidth) * 2 - 1;
          P.ty = (e.clientY / innerHeight) * 2 - 1;
          P.cx = e.clientX;
          P.cy = e.clientY;
        },
        { passive: true },
      );

      const pos = shellGeo.attributes.position,
        proj = new THREE.Vector3();
      // two layered sine fields push the glass in and out; amplitude rises with pointer proximity and scroll speed
      const displace = (t: number, amp: number) => {
        const a = pos.array as Float32Array;
        for (let i = 0; i < a.length; i += 3) {
          const x = base[i],
            y = base[i + 1],
            z = base[i + 2];
          const n = Math.sin(x * 1.9 + t * 0.9) * Math.sin(y * 2.3 + t * 1.1) * Math.sin(z * 1.7 + t * 0.7) + 0.45 * Math.sin(x * 4.1 - t * 1.4 + y * 2.0) * Math.sin(z * 3.6 + t);
          const r = 1 + amp * n;
          a[i] = x * r;
          a[i + 1] = y * r;
          a[i + 2] = z * r;
        }
        pos.needsUpdate = true;
        shellGeo.computeVertexNormals();
      };

      // Compile shaders one top-level object at a time. Where KHR_parallel_shader_compile exists this happens
      // off the main thread; elsewhere the blocking work is at least spread across frames.
      for (const obj of [...scene.children]) {
        await renderer.compileAsync(obj, camera, scene).catch(() => {});
        mark("compiled:" + (obj.type || "object"));
        await nextTask();
        if (!ctx.flags.alive) return bail();
      }
      // Warm-up draws, one object per frame (sub-pixel orb, behind the still-transparent canvas). Some drivers only
      // link a shader on its first draw; drawing each object alone spreads that cost over several frames, and it
      // also allocates the glass's transmission target and uploads every buffer, so the bloom later costs nothing.
      rig.scale.setScalar(0.001);
      const solo = [...scene.children].filter((o) => !(o as { isLight?: boolean }).isLight);
      for (const obj of solo) {
        solo.forEach((o) => (o.visible = o === obj));
        renderer.render(scene, camera);
        await nextTask();
        if (!ctx.flags.alive) return bail();
      }
      solo.forEach((o) => (o.visible = true));
      renderer.render(scene, camera);
      mark("warm-up");
      await nextTask();
      if (!ctx.flags.alive) return bail();

      let shown = false,
        fadeTimer = 0;
      ctx.frameFns.add((_now, k, y) => {
        const on = motionOn();
        if (on) clock += 0.016 * k;
        if (introPose || (root.classList.contains("entered") && !root.dataset.intro)) enter += (1 - enter) * lerpK(introPose ? 0.022 : 0.035, k);
        const ip = introPose ? introOverride : null;
        if (ip?.full) enter = 1;
        if (!warpHold) warp += (0 - warp) * lerpK(0.025, k);

        vel += ((y - lastY) / k - vel) * lerpK(0.12, k);
        lastY = y;
        const T = target(y),
          r = on ? lerpK((introPose && introOverride?.rate) || 0.06, k) : 1;
        // smoothed scroll for rotations and parallax, so wheel steps never jolt the scene
        smoothY = smoothY + (y - smoothY) * (on ? lerpK(0.1, k) : 1);
        (Object.keys(T.pose) as (keyof Pose)[]).forEach((key) => (cur[key] += (T.pose[key] - cur[key]) * r));

        P.x += (P.tx - P.x) * lerpK(0.08, k);
        P.y += (P.ty - P.y) * lerpK(0.08, k);
        const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z,
          hw = hh * camera.aspect;
        const ease = 1 - Math.pow(1 - Math.min(1, enter), 3);
        rig.position.x = cur.x * hw + P.x * 0.12;
        rig.position.y = cur.y * hh - P.y * 0.08 - (1 - ease) * 0.8;
        const rigScale = Math.max(0.001, cur.s * (0.15 + 0.85 * ease));
        rig.scale.setScalar(rigScale);
        // a sub-pixel orb (intro start) isn't drawn at all: no glass refraction pass, no rings
        rig.visible = rigScale > 0.004;

        // pointer proximity on the projected centre: the glass swells when you reach it
        proj.copy(rig.position).project(camera);
        const sx = ((proj.x + 1) / 2) * innerWidth,
          sy = ((1 - proj.y) / 2) * innerHeight;
        const rad = ((cur.s * hh) / camera.position.z) * innerHeight * 0.32 + 40;
        const d = P.cx == null ? 9999 : Math.hypot(P.cx - sx, P.cy - sy);
        const nearNow = d < rad && cur.op > 0.6;
        P.near += ((nearNow ? 1 : 0) - P.near) * lerpK(0.08, k);

        sv += (Math.min(1, Math.abs(vel) / 60) - sv) * lerpK(0.04, k);
        if (on && rig.visible && shell.visible) displace(clock, 0.05 + 0.08 * P.near + 0.06 * sv);

        spin.rotation.y = clock * 0.22 + P.x * 0.5 + smoothY * 0.0009;
        spin.rotation.x = clock * 0.11 - P.y * 0.35;
        ringA.rotation.z = clock * 0.3;
        ringB.rotation.z = -clock * 0.2 + smoothY * 0.0006;
        ringA.material.opacity = 0.9 * cur.op;
        ringB.material.opacity = 0.6 * cur.op;

        const sh = Math.max(0, Math.min(1, cur.shell));
        shell.visible = sh > 0.003;
        shellMat.opacity = sh;
        shell.scale.setScalar(1 + (1 - sh) * 0.4);
        const ex = cur.ex;
        core.scale.setScalar(1 + ex * 0.9);
        wireMat.emissiveIntensity = 0.7 + 0.35 * Math.max(ex, 1 - sh);
        nodesMat.size = 0.07 + ex * 0.04;
        inner.rotation.set(clock * 0.8, clock * 1.1, 0);
        dust.rotation.y = clock * 0.02 + smoothY * 0.00015 + warp * 1.2;
        dust.scale.setScalar(Math.max(0.03, 1 + warp * 2.5));
        galaxy.forEach((g) => {
          g.obj.scale.setScalar(Math.max(0.03, 1 + warp * 1.6));
          g.obj.position.y = smoothY * g.k;
          g.obj.position.x = -P.x * g.k * 160;
          if (g.uT) g.uT.value = clock;
        });

        renderer.render(scene, camera);
        if (!shown) {
          shown = true;
          root.dataset.gl = "on";
          // after the fade-in, drop the transition
          fadeTimer = window.setTimeout(() => (canvas.style.transition = "none"), 1300);
          markReady();
        }
      });

      ctx.cleanup(() => {
        clearTimeout(fadeTimer);
        delete root.dataset.gl;
        canvas.style.transition = "";
        scene.traverse((o) => {
          const m = o as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
          m.geometry?.dispose();
          (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []).forEach((mt) => mt.dispose());
        });
        scene.environment?.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      });
    })
    .catch((e) => {
      console.warn("3D stage failed to load", e);
      markReady();
    });

  return {
    ready,
    /** Galaxy intro pose + star warp (the pose itself follows html[data-intro]). */
    intro: (v: boolean) => v && ctl.startIntro(),
    /** Kick the star warp to at least v. */
    warp: (v = 0.8) => ctl.warp(v),
    /** Drive the orb directly during the intro (null hands back to the section poses); instant = snap. */
    pose: (p: IntroPose | null, instant = false) => {
      introOverride = p;
      if (p && instant) ctl.snap(p);
    },
    /** Set the warp; hold keeps it from decaying until release(). */
    setWarp: (v: number, hold = false) => ctl.setWarp(v, hold),
    release: () => ctl.release(),
    /** The hero pose (for the intro to sail to), or null before the scene exists. */
    heroPose: () => ctl.heroPose(),
  };
}
