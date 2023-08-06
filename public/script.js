let video;
let handpose;
let predictions = [];
const maxDist = 200; // Valor máximo para la distancia

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  handpose = ml5.handpose(video, modelReady);

  handpose.on("predict", (results) => {
    predictions = results;
  });

  video.hide();
}

function modelReady() {
  console.log("Model Loaded");
}

function draw() {
  image(video, 0, 0, width, height);

  drawKeypoints();

  const letter = checkHandShape(predictions);
  select("#letter").html(`Letter: ${letter}`);
}

function drawKeypoints() {
  const letter = checkHandShape(predictions);
  let color;
  if (letter === "H") {
    color = [255, 0, 0]; // Rojo para H
  } else if (letter === "O") {
    color = [0, 0, 255]; // Azul para O
  } else {
    color = [0, 255, 0]; // Verde para ninguna letra
  }

  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      fill(...color);
      noStroke();
      ellipse(keypoint[0], keypoint[1], 10, 10);
    }
  }
}

function checkHandShape(predictions) {
  if (predictions.length === 0) {
    return "";
  }

  const keypoints = predictions[0].landmarks;
  const thumbTip = keypoints[4];
  const indexTip = keypoints[8];
  const middleTip = keypoints[12];
  const ringTip = keypoints[16];
  const pinkyTip = keypoints[20];

  const thumbDist = dist3D(keypoints[0], thumbTip);
  const indexDist = dist3D(keypoints[0], indexTip);
  const middleDist = dist3D(keypoints[0], middleTip);
  const ringDist = dist3D(keypoints[0], ringTip);
  const pinkyDist = dist3D(keypoints[0], pinkyTip);

  console.log(`Thumb distance: ${thumbDist}`);
  console.log(`Index distance: ${indexDist}`);
  console.log(`Middle distance: ${middleDist}`);
  console.log(`Ring distance: ${ringDist}`);
  console.log(`Pinky distance: ${pinkyDist}`);

  const distThreshold = 50; // Puedes ajustar este valor según sea necesario

  const hConfidence = calculateConfidence(
    [thumbDist, indexDist, middleDist, ringDist, pinkyDist],
    [
      distThreshold,
      distThreshold * 2,
      distThreshold * 2,
      distThreshold,
      distThreshold,
    ]
  );
  const oConfidence = calculateConfidence(
    [thumbDist, indexDist, middleDist, ringDist, pinkyDist],
    [distThreshold, distThreshold, distThreshold, distThreshold, distThreshold]
  );

  select("#h-confidence").html(`${hConfidence.toFixed(2)}%`);
  select("#o-confidence").html(`${oConfidence.toFixed(2)}%`);

  // Cambio en la lógica de comparación
  if (hConfidence > oConfidence && hConfidence > 75) {
    return "H";
  }

  if (oConfidence > hConfidence && oConfidence > 75) {
    return "O";
  }

  const lConfidence = calculateConfidence(
    [thumbDist, indexDist, middleDist, ringDist, pinkyDist],
    [
      distThreshold,
      distThreshold * 3,
      distThreshold * 3,
      distThreshold * 3,
      distThreshold * 3,
    ]
  );
  const aConfidence = calculateConfidence(
    [thumbDist, indexDist, middleDist, ringDist, pinkyDist],
    [
      distThreshold,
      distThreshold * 3,
      distThreshold * 3,
      distThreshold * 3,
      distThreshold,
    ]
  );

  select("#l-confidence").html(`${lConfidence.toFixed(2)}%`);
  select("#a-confidence").html(`${aConfidence.toFixed(2)}%`);

  // Cambio en la lógica de comparación
  const confidences = [hConfidence, oConfidence, lConfidence, aConfidence];
  const letters = ["H", "O", "L", "A"];
  const maxConfidence = Math.max(...confidences);
  if (maxConfidence > 75) {
    return letters[confidences.indexOf(maxConfidence)];
  }

  return "";
}

const calculateConfidence = (currentDists, idealDists) => {
  let totalDiff = 0;

  for (let i = 0; i < currentDists.length; i++) {
    totalDiff += Math.abs(currentDists[i] - idealDists[i]);
  }

  const avgDiff = totalDiff / currentDists.length;
  const confidence = 100 - (avgDiff / maxDist) * 100;

  return confidence;
};

const dist3D = (point1, point2) => {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const dz = point2[2] - point1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
