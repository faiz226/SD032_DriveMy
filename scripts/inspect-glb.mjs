import { readFileSync } from 'fs';

const buf = readFileSync('public/toyota-corolla-e170-2017.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.slice(20, 20 + jsonLen).toString('utf8');
const gltf = JSON.parse(jsonStr);

// Compute overall scene bounding box in model space
let allMins = [], allMaxs = [];

gltf.nodes.forEach((n) => {
  if (n.mesh !== undefined) {
    const mesh = gltf.meshes[n.mesh];
    if (mesh && mesh.primitives) {
      mesh.primitives.forEach(prim => {
        const posIdx = prim.attributes.POSITION;
        if (posIdx !== undefined) {
          const acc = gltf.accessors[posIdx];
          if (acc.min && acc.max) {
            allMins.push(acc.min);
            allMaxs.push(acc.max);
          }
        }
      });
    }
  }
});

const sceneMin = [
  Math.min(...allMins.map(m=>m[0])),
  Math.min(...allMins.map(m=>m[1])),
  Math.min(...allMins.map(m=>m[2]))
];
const sceneMax = [
  Math.max(...allMaxs.map(m=>m[0])),
  Math.max(...allMaxs.map(m=>m[1])),
  Math.max(...allMaxs.map(m=>m[2]))
];
const size = sceneMin.map((v,i) => sceneMax[i] - v);
const center = sceneMin.map((v,i) => (v+sceneMax[i])/2);

console.log('Scene bounding box (model space):');
console.log('  min:', sceneMin.map(v=>v.toFixed(3)));
console.log('  max:', sceneMax.map(v=>v.toFixed(3)));
console.log('  size:', size.map(v=>v.toFixed(3)));
console.log('  center:', center.map(v=>v.toFixed(3)));

// The scene root has a matrix:
// [1, 0, 0, 0,   0, ~0, 1, 0,   0, -1, ~0, 0,   0, 0, 0, 1]
// This rotates X=X, Y=Z(model), Z=-Y(model)
// So world coords from model coords:
// worldX = modelX, worldY = modelZ, worldZ = -modelY
// For scale 0.015:
console.log('\nWith root matrix (X=X, Y=modelZ, Z=-modelY) and scale=0.015:');
console.log('  worldX range:', [sceneMin[0]*0.015, sceneMax[0]*0.015].map(v=>v.toFixed(3)));
console.log('  worldY range:', [sceneMin[2]*0.015, sceneMax[2]*0.015].map(v=>v.toFixed(3)));
console.log('  worldZ range:', [-sceneMax[1]*0.015, -sceneMin[1]*0.015].map(v=>v.toFixed(3)));
console.log('  car width (worldX):', (size[0]*0.015).toFixed(3), 'm');
console.log('  car height (worldY):', (size[2]*0.015).toFixed(3), 'm');
console.log('  car length (worldZ):', (size[1]*0.015).toFixed(3), 'm');

// Proper scale to make it ~1.8m wide (real car)
const properScale = 1.8 / size[0];
console.log('\nProper scale for 1.8m car width:', properScale.toFixed(4));
console.log('At scale 1.0, car width =', size[0].toFixed(3), 'm');
