// DriveMy v2: checks that flipped rear-facing cameras behave like real mirrors. Reference for
// WP3's mirror test; not app code. Usage, from the app folder: node docs/v2-plan/physics/mirror-check.mjs node_modules/three
// Car at the origin facing +X; left is -Z. Result (14 Oct 2026): images move left as the pole moves
// left in all three mirrors; each door mirror shows the flank by the rear wheel at its inner edge.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const THREE = await import(pathToFileURL(resolve(process.argv[2], 'build/three.module.js')).href);
function mirrorCam(pos, yawOut, pitchDown, hfovDeg, aspect, side) {
  const vf = 2 * Math.atan(Math.tan((hfovDeg * Math.PI) / 360) / aspect) * 180 / Math.PI;
  const cam = new THREE.PerspectiveCamera(vf, aspect, 0.1, 60);
  cam.position.set(...pos);
  // look backward (-X), turned outboard (side: -1 left, +1 right, 0 centre) and down
  const back = new THREE.Vector3(-Math.cos(yawOut), -Math.tan(pitchDown), side * Math.sin(yawOut));
  cam.lookAt(cam.position.clone().add(back));
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  return cam;
}
const shown = (cam, p) => { const v = new THREE.Vector3(...p).project(cam); return { x: +(-v.x).toFixed(2), y: +v.y.toFixed(2) }; }; // display flip
const deg = Math.PI / 180;
const cams = {
  left: mirrorCam([0.55, 1.0, -0.92], 15 * deg, 14 * deg, 35, 1.5, -1),
  right: mirrorCam([0.55, 1.0, 0.92], 15 * deg, 14 * deg, 35, 1.5, +1),
  interior: mirrorCam([0.25, 1.25, 0], 0, 3 * deg, 50, 4, 0),
};
for (const [name, cam] of Object.entries(cams)) {
  const xs = [1.0, 0, -1.0, -2.0].map((z) => shown(cam, [-5, 0.6, z]).x);   // pole moving to the car's left
  console.log(name, 'pole x as it moves left:', JSON.stringify(xs));
}
console.log('left mirror, flank by rear wheel:', JSON.stringify(shown(cams.left, [-1.225, 0.45, -0.866])));
console.log('right mirror, flank by rear wheel:', JSON.stringify(shown(cams.right, [-1.225, 0.45, 0.866])));
