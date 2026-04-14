const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const launchSound = document.getElementById("launchSound");
const boomSound = document.getElementById("boomSound");

// Firework Particles settings
const MAX_PARTICLES = 900;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.globalCompositeOperation = "lighter";

let audioUnlocked = false;
let activeBoomSounds = 0;
let lastLaunchSound = 0;
let lastBoomSound = 0;
let particles = [];
let rockets = [];

// Audio setting, click for sound
window.addEventListener("click", () => {
  if (!audioUnlocked) {
    launchSound.play().then(() => {
      launchSound.pause();
      launchSound.currentTime = 0;
      audioUnlocked = true;
    }).catch(()=>{});
  }
});

// Utils
function random(min, max) {
  return Math.random() * (max - min) + min;
}

const colorPalette = [0, 30, 50, 120, 200, 280];

function getRealisticHue() {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

// Background, star & moon
let stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.3
  });
}

const moon = {
  x: canvas.width * 0.85,
  y: canvas.height * 0.2,
  r: 40
};

function drawBackground() {
  ctx.save();
  ctx.globalAlpha = 0.45;

  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }

  ctx.restore();

  const grad = ctx.createRadialGradient(
    moon.x, moon.y, moon.r * 0.3,
    moon.x, moon.y, moon.r * 2
  );

  grad.addColorStop(0, "rgba(255,255,210,0.9)");
  grad.addColorStop(1, "rgba(255,255,210,0)");

  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

// Firework Particle class
class Particle {
  constructor(x, y, hue, type = "normal", power = 1) {
    this.x = x;
    this.y = y;
    this.hue = hue;
    this.alpha = 1;
    this.type = type;

    this.size = random(1.2, 2.4) * power;
    this.trail = [];

    const angle = Math.random() * Math.PI * 2;
    const speed = random(2, 4) * power;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.gravity = 0.04;
    this.drag = 0.985;
    this.decay = random(0.012, 0.02);

    if (type === "silk") {
      this.gravity = 0.015;
      this.drag = 0.992;
      this.decay = random(0.005, 0.009);
    }

    if (type === "crackle") {
      this.gravity = 0.05;
      this.decay = random(0.02, 0.035);
      this.size = random(0.8, 1.5);
    }

    if (type === "sakura") {
      this.gravity = 0.018;
      this.decay = random(0.006, 0.01);
    }

    if (type === "goldenSilk") {
      this.gravity = 0.01;
      this.drag = 0.995;
      this.decay = random(0.004, 0.007);
    }
  }

  update() {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;

    this.alpha -= this.decay;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 4) this.trail.shift();
  }

  draw() {
    if (this.alpha <= 0) return;

    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${this.hue},100%,70%)`;

    for (let p of this.trail) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.size, 0, Math.PI * 2);

      if (this.type === "sakura") {
        ctx.fillStyle = `hsl(330,80%,70%)`;
      } else if (this.type === "goldenSilk") {
        ctx.fillStyle = `rgba(255,220,150,${this.alpha})`;
      } else {
        ctx.fillStyle = `hsl(${this.hue},100%,65%)`;
      }

      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }
}

// Fireworks / Rocket class
class Rocket {
  constructor() {
    this.x = random(100, canvas.width - 100);
    this.y = canvas.height;

    this.vx = random(-0.2, 0.2);
    this.vy = random(-8.5, -10);

    this.targetY = random(canvas.height * 0.35, canvas.height * 0.6);
    this.hue = getRealisticHue();
    this.exploded = false;

    const now = performance.now();

    // Firework launch sound
    if (audioUnlocked && now - lastLaunchSound > 1200 && Math.random() < 0.18) {
      lastLaunchSound = now;

      const s = launchSound.cloneNode();
      s.volume = 0.03;
      s.playbackRate = 0.9 + Math.random() * 0.2;
      s.play().catch(()=>{});
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.045;

    if (this.y <= this.targetY && !this.exploded) {
      this.explode();
      this.exploded = true;
    }
  }

  explode() {
    const r = Math.random();

    let type =
      r < 0.30 ? "hanabi" :
      r < 0.50 ? "kamuro" :
      r < 0.65 ? "sakura" :
      r < 0.80 ? "chrysanthemum" :
      "normal";

    const count =
      type === "hanabi" ? 200 :
      type === "sakura" ? 160 :
      type === "chrysanthemum" ? 170 :
      100;

    // Main burst (fireworks)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = random(2, 4);

      const p = new Particle(this.x, this.y, this.hue, type);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      particles.push(p);
    }

    // Golden silk firework effect
    if (Math.random() < 0.35) {
      for (let i = 0; i < 70; i++) {
        particles.push(new Particle(this.x, this.y, 45, "goldenSilk"));
      }
    }

    // Crackle firework effect
    if (Math.random() < 0.3) {
      for (let i = 0; i < 25; i++) {
        particles.push(new Particle(this.x, this.y, 50, "crackle"));
      }
    }

    // Firework explosion/boom sound
    const now = performance.now();

    if (audioUnlocked && now - lastBoomSound > 900 && activeBoomSounds < 2) {
      lastBoomSound = now;
      activeBoomSounds++;

      const base = boomSound.cloneNode();
      base.volume = 0.05;
      base.play().catch(()=>{});

      base.onended = () => activeBoomSounds--;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue},100%,65%)`;
    ctx.fill();
  }
}

// Firework launch loop and animation
function launchLoop() {
  if (rockets.length < 4) rockets.push(new Rocket());
  setTimeout(launchLoop, 500);
}

function animate() {
  requestAnimationFrame(animate);

  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  rockets.forEach((r, i) => {
    r.update();
    r.draw();
    if (r.exploded) rockets.splice(i, 1);
  });

  particles = particles.filter(p => p.alpha > 0);

  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }

  particles.forEach(p => p.update() || p.draw());
}

launchLoop();
animate();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});



// OLD CODE (for reference, not part of the final file)

// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");

// const launchSound = document.getElementById("launchSound");
// const boomSound = document.getElementById("boomSound");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

// let particles = [];
// let rockets = [];

// ctx.globalCompositeOperation = "lighter";

// /* ================= SETTINGS ================= */

// const MAX_PARTICLES = 800;

// /* ================= AUDIO ================= */

// let audioUnlocked = false;
// let activeBoomSounds = 0;

// let lastLaunchSound = 0;
// let lastBoomSound = 0;

// window.addEventListener("click", () => {
//   if (!audioUnlocked) {
//     launchSound.play().then(() => {
//       launchSound.pause();
//       launchSound.currentTime = 0;
//       audioUnlocked = true;
//     }).catch(()=>{});
//   }
// });

// /* ================= UTILS ================= */

// function random(min, max) {
//   return Math.random() * (max - min) + min;
// }

// const colorPalette = [0, 30, 50, 120, 200, 280];

// function getRealisticHue() {
//   return colorPalette[Math.floor(Math.random() * colorPalette.length)];
// }

// /* ================= BACKGROUND ================= */

// let stars = [];
// for (let i = 0; i < 100; i++) {
//   stars.push({
//     x: Math.random() * canvas.width,
//     y: Math.random() * canvas.height,
//     r: Math.random() * 1.3
//   });
// }

// const moon = {
//   x: canvas.width * 0.85,
//   y: canvas.height * 0.2,
//   r: 40
// };

// function drawBackground() {
//   ctx.save();
//   ctx.globalAlpha = 0.45;

//   for (let s of stars) {
//     ctx.beginPath();
//     ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
//     ctx.fillStyle = "white";
//     ctx.fill();
//   }

//   ctx.restore();

//   const grad = ctx.createRadialGradient(
//     moon.x, moon.y, moon.r * 0.3,
//     moon.x, moon.y, moon.r * 2
//   );
//   grad.addColorStop(0, "rgba(255,255,210,0.9)");
//   grad.addColorStop(1, "rgba(255,255,210,0)");

//   ctx.beginPath();
//   ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
//   ctx.fillStyle = grad;
//   ctx.fill();
// }

// /* ================= PARTICLE ================= */

// class Particle {
//   constructor(x, y, hue, type = "normal", power = 1) {
//     this.x = x;
//     this.y = y;
//     this.hue = hue;
//     this.alpha = 1;
//     this.type = type;

//     this.size = random(1.2, 2.4) * power;
//     this.trail = [];

//     let angle = Math.random() * Math.PI * 2;
//     let speed = random(2, 4) * power;

//     if (["hanabi","chrysanthemum","sakura"].includes(type)) {
//       speed = random(2.5, 3.5);
//     }

//     this.vx = Math.cos(angle) * speed;
//     this.vy = Math.sin(angle) * speed;

//     this.gravity = 0.04;
//     this.drag = 0.985;
//     this.decay = random(0.012, 0.02);

//     if (type === "silk") {
//       this.gravity = 0.015;
//       this.drag = 0.992;
//       this.decay = random(0.005, 0.009);
//     }

//     if (type === "crackle") {
//       this.gravity = 0.05;
//       this.decay = random(0.02, 0.035);
//       this.size = random(0.8, 1.5);
//     }

//     if (["hanabi","chrysanthemum","sakura"].includes(type)) {
//       this.gravity = 0.02;
//       this.drag = 0.99;
//     }
//   }

//   update() {
//     this.vx *= this.drag;
//     this.vy *= this.drag;
//     this.vy += this.gravity;

//     this.x += this.vx;
//     this.y += this.vy;

//     this.alpha -= this.decay;

//     this.trail.push({ x: this.x, y: this.y });
//     if (this.trail.length > 4) this.trail.shift();
//   }

//   draw() {
//     if (this.alpha <= 0) return;

//     ctx.globalAlpha = this.alpha;

//     if (this.type === "crackle") {
//       if (Math.random() < 0.5) return;
//       ctx.shadowBlur = 3;
//     } else {
//       ctx.shadowBlur = 10;
//     }

//     ctx.shadowColor = `hsl(${this.hue},100%,70%)`;

//     for (let p of this.trail) {
//       ctx.beginPath();
//       ctx.arc(p.x, p.y, this.size, 0, Math.PI * 2);

//       if (this.type === "silk") {
//         ctx.fillStyle = `rgba(255,240,200,${this.alpha})`;
//       } else if (this.type === "sakura") {
//         ctx.fillStyle = `hsl(330,80%,70%)`;
//       } else {
//         ctx.fillStyle = `hsl(${this.hue},100%,65%)`;
//       }

//       ctx.fill();
//     }

//     ctx.shadowBlur = 0;
//   }
// }

// /* ================= ROCKET ================= */

// let hanabiCounter = 0;
// let nextHanabi = Math.floor(random(12, 20));

// let sakuraCounter = 0;
// let nextSakura = Math.floor(random(22, 30));

// class Rocket {
//   constructor(x) {
//     this.x = x || random(100, canvas.width - 100);
//     this.y = canvas.height;

//     this.vx = random(-0.2, 0.2);
//     this.vy = random(-8.5, -10);

//     this.targetY = random(canvas.height * 0.35, canvas.height * 0.6);
//     this.hue = getRealisticHue();
//     this.exploded = false;

//     const now = performance.now();

//     // 🔊 LESS frequent launch
//     if (
//       audioUnlocked &&
//       now - lastLaunchSound > 800 &&
//       Math.random() < 0.22
//     ) {
//       lastLaunchSound = now;

//       const s = launchSound.cloneNode();
//       s.volume = 0.035 + Math.random() * 0.02;
//       s.playbackRate = 0.85 + Math.random() * 0.2;
//       s.play().catch(()=>{});
//     }
//   }

//   update() {
//     this.x += this.vx;
//     this.y += this.vy;
//     this.vy += 0.045;

//     if (this.y <= this.targetY && !this.exploded) {
//       this.explode();
//       this.exploded = true;
//     }
//   }

//   explode() {
//     hanabiCounter++;
//     sakuraCounter++;

//     let type = "normal";

//     if (hanabiCounter >= nextHanabi) {
//       type = "hanabi";
//       hanabiCounter = 0;
//     } else if (sakuraCounter >= nextSakura) {
//       type = "sakura";
//       sakuraCounter = 0;
//     } else {
//       const roll = Math.random();
//       if (roll < 0.6) type = "normal";
//       else if (roll < 0.88) type = "chrysanthemum";
//     }

//     const count =
//       type === "hanabi" ? 200 :
//       type === "sakura" ? 160 :
//       type === "chrysanthemum" ? 170 :
//       100;

//     for (let i = 0; i < count; i++) {
//       let hue = type === "sakura" ? 330 : this.hue;
//       particles.push(new Particle(this.x, this.y, hue, type));
//     }

//     /* silk */
//     if (type === "hanabi") {
//       for (let i = 0; i < 60; i++) {
//         particles.push(new Particle(this.x, this.y, 50, "silk"));
//       }
//     }

//     if (type === "chrysanthemum" && Math.random() < 0.35) {
//       for (let i = 0; i < 40; i++) {
//         particles.push(new Particle(this.x, this.y, 50, "silk"));
//       }
//     }

//     if (Math.random() < 0.12) {
//       for (let i = 0; i < 30; i++) {
//         particles.push(new Particle(this.x, this.y, 50, "silk"));
//       }
//     }

//     /* crackle */
//     if (Math.random() < 0.3) {
//       for (let i = 0; i < 25; i++) {
//         particles.push(new Particle(this.x, this.y, 50, "crackle"));
//       }
//     }

//     /* layered shell */
//     if (Math.random() < 0.07) {
//       setTimeout(() => {
//         for (let i = 0; i < 80; i++) {
//           particles.push(new Particle(this.x, this.y, this.hue, "chrysanthemum", 0.8));
//         }
//       }, 150);

//       setTimeout(() => {
//         for (let i = 0; i < 50; i++) {
//           particles.push(new Particle(this.x, this.y, random(0,360), "chrysanthemum", 0.6));
//         }
//       }, 300);
//     }

//     /* 🔊 boom + echo */
//     const now = performance.now();

//     if (
//       audioUnlocked &&
//       now - lastBoomSound > 650 &&
//       activeBoomSounds < 2
//     ) {
//       lastBoomSound = now;
//       activeBoomSounds++;

//       const heightFactor = 1 - this.targetY / canvas.height;
//       const delay = 250 + heightFactor * 700;

//       setTimeout(() => {
//         const base = boomSound.cloneNode();
//         base.volume = 0.08;
//         base.playbackRate = 0.85;
//         base.play().catch(()=>{});

//         setTimeout(() => {
//           const echo1 = boomSound.cloneNode();
//           echo1.volume = 0.04;
//           echo1.playbackRate = 0.7;
//           echo1.play().catch(()=>{});
//         }, 200);

//         if (Math.random() < 0.5) {
//           setTimeout(() => {
//             const echo2 = boomSound.cloneNode();
//             echo2.volume = 0.025;
//             echo2.playbackRate = 0.6;
//             echo2.play().catch(()=>{});
//           }, 350);
//         }

//         base.onended = () => activeBoomSounds--;
//       }, delay);
//     }
//   }

//   draw() {
//     ctx.beginPath();
//     ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
//     ctx.fillStyle = `hsl(${this.hue},100%,65%)`;
//     ctx.fill();
//   }
// }

// /* ================= LOOP ================= */

// function launchLoop() {
//   if (rockets.length < 4) {
//     rockets.push(new Rocket());
//   }
//   setTimeout(launchLoop, 500);
// }

// function animate() {
//   requestAnimationFrame(animate);

//   ctx.fillStyle = "rgba(0,0,0,0.08)";
//   ctx.fillRect(0, 0, canvas.width, canvas.height);

//   drawBackground();

//   rockets.forEach((r, i) => {
//     r.update();
//     r.draw();
//     if (r.exploded) rockets.splice(i, 1);
//   });

//   particles = particles.filter(p => p.alpha > 0);

//   if (particles.length > MAX_PARTICLES) {
//     particles.splice(0, particles.length - MAX_PARTICLES);
//   }

//   particles.forEach(p => {
//     p.update();
//     p.draw();
//   });
// }

// launchLoop();
// animate();

// window.addEventListener("resize", () => {
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
// });