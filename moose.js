let topic = "group4toothbrush2";
let threshold = 20;
let video;
let grid = {}
let mappedX = 0;
let mappedY = 0;
let ima;
let mooseX = 200;
let mooseY = 200;
let mooseWidth = 180;
let mooseHeight = 180;
let mooseImg;
let xOff = 0;
let yOff = 1000;
let speed = 1.6
let forestAudio;
let level = 1;
let aim;
let arrow;
let hasShot = false
let mooseDead;
let mooseAlive = true
let deadImg
let mooseShrink = 0;
let backgroundAudio;
let footstepsAudio;
let ampMeter = 0;
let totalAcello = 0;
let mooseCalled = false;
let recognizer = null;
let isListening = false;
const url = "https://teachablemachine.withgoogle.com/models/YZVL1Z8o-/";


function preload(){
  img = loadImage('assets/forest.jpg');
  mooseImg = loadImage('assets/moose.png');
  forestAudio = loadSound('assets/nature.mp3');
  footstepsAudio = loadSound('assets/footsteps.mp3');
  aim = loadImage('assets/aim.png')
  arrow = loadSound('assets/arrow.wav');
  mooseDead = loadSound("assets/mooseDead.wav")
  deadImg = loadImage('assets/dead.png')
  backgroundAudio = loadSound('assets/huntSoundScape.mp3')
}

async function createModel() {
  const checkpointURL = url + "model.json";
  const metadataURL = url + "metadata.json";

  const recognizer = speechCommands.create(
      "BROWSER_FFT",
      undefined,
      checkpointURL,
      metadataURL);

  await recognizer.ensureModelLoaded();
  return recognizer;
}

async function initializeAudio() {
  if (!recognizer) {
    recognizer = await createModel();
  }
}




async function setup() {
  createCanvas(windowWidth, windowHeight);

  background(img);
  setupMQTT(topic);
  //sendMessage("we are online!");
  noStroke();

  mooseY = height -300
  await initializeAudio();
}

function startMooseCall() {
  if (!isListening && recognizer) {
    isListening = true;
    recognizer.listen(result => {
      const score = result.scores[1];
      const percentage = (score * 100).toFixed(0);

      if (percentage >= 80) {
        mooseCalled = true;
        mooseX = width + 300;
        recognizer.stopListening();
        isListening = false;
      }
    }, {
      includeSpectrogram: true,
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.50
    });
  }
}



function onMessage(message) {
  //console.log(message)

  if(message["type"] == "values"){

    // udregner koordinater der skal ændres i grid, når besked modtages

  let alpha = message["alpha"] * 2;
  let beta = message["beta"] * 2;

  let x = (alpha+180) % 360;
  //map udvalgt spænd af gyroskopets alpha værdi til en position på canvas langs x-aksen
  mappedX = map(x, 90, 270, 0, windowWidth);
  let y = beta + 180;
  //map udvalgt spænd af gyroskopet beta værdi til en position på canvas langs y-aksen
  mappedY = map(y, 100, 220, windowHeight, 0);

  //calculate accelo
  totalAcello = Math.abs(message["x"])+Math.abs(message["y"])+Math.abs(message["z"])



  // //change amp according to accelo
  totalAcello = constrain(totalAcello, 0, 500);
  ampMeter += totalAcello*0.4
  let mappedAmp = map(ampMeter, 0,8000,0,1)
  footstepsAudio.amp(mappedAmp)


  //moove the moose faster when noise is made
  speed = 1.2 + mappedAmp*8
  }

  if(message["type"] == "shot"){
    arrow.play()
    checkShot()
  }
}

function checkShot(){
  let xDif = mappedX - mooseX
  let yDif = mappedY - mooseY

  console.log(xDif,yDif)

  if(xDif > 0 && xDif < 140 && yDif > 0 && yDif < 140 ){
    mooseDead.play()
    mooseAlive = false
  }

}


function touchStarted(){
  //forestAudio.play()
  backgroundAudio.loop();
  footstepsAudio.loop();
  footstepsAudio.amp(0);
  backgroundAudio.amp(1);

}


function draw() {
  startMooseCall();

  //movement
  if(mooseAlive && mooseCalled){
  //move moose with perlin noise
  //mooseX = noise(xOff) * width
  mooseY = noise(yOff) * 500+200
  //xOff += 0.003 * speed;
  yOff += 0.005;

  //move moose horizontally
  mooseX -= speed;
  //mooseY += speed;

  mooseShrink = 0.2*(mooseY-windowHeight);

    if(mooseX < 0) mooseX = width + 1000;
  }

  translate(width,0);
  scale(-1.0,1.0);

  background(img)

  //draw moose
  if(mooseAlive && mooseCalled){image(mooseImg,mooseX,mooseY,mooseWidth+mooseShrink,mooseHeight+mooseShrink)}

  else if(!mooseAlive && mooseCalled){image(deadImg,mooseX,mooseY,mooseWidth,mooseHeight)}

  //draw aim

  fill(255,0,0)
  image(aim,mappedX,mappedY,20,20)

  //turn down ampMeter

  ampMeter -= 180
  ampMeter = constrain(ampMeter,0,8000)
  console.log(Math.floor(ampMeter) + "\t\t\t\t" + totalAcello)
}
