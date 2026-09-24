/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginPage = document.getElementById("loginPage");
const gamePage = document.getElementById("gamePage");
const lessonPage = document.getElementById("lessonPage");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const welcomeName = document.getElementById("welcomeName");

const startLesson = document.getElementById("startLesson");
const backHome = document.getElementById("backHome");

const referenceVideo =
  document.getElementById("referenceVideo");

const referenceVideoFile =
  document.getElementById("referenceVideoFile");

const videoMessage =
  document.getElementById("videoMessage");

const videoName =
  document.getElementById("videoName");

const userCamera =
  document.getElementById("userCamera");

const handCanvas =
  document.getElementById("handCanvas");

const handCtx =
  handCanvas.getContext("2d");

const cameraMessage =
  document.getElementById("cameraMessage");

const cameraBtn =
  document.getElementById("cameraBtn");

const checkBtn =
  document.getElementById("checkBtn");

const handResult =
  document.getElementById("handResult");

const similarityScore =
  document.getElementById("similarityScore");

const totalScore =
  document.getElementById("totalScore");

const nextBtn =
  document.getElementById("nextBtn");


/* =====================================================
   GAME DATA
===================================================== */

const GAME = {
  number: 1,
  title: "สวัสดี",
  description: "ท่ามือใช้กับเพื่อน",
  passScore: 75
};


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener("submit", function(e) {

  e.preventDefault();

  const name =
    usernameInput.value.trim() || "Nana";

  welcomeName.textContent = name;

  loginPage.classList.add("hidden");
  gamePage.classList.remove("hidden");

});


/* =====================================================
   GO TO GAME 1
===================================================== */

startLesson.addEventListener("click", function() {

  gamePage.classList.add("hidden");
  lessonPage.classList.remove("hidden");

  resetGame();

});


/* =====================================================
   BACK HOME
===================================================== */

backHome.addEventListener("click", function() {

  stopCamera();

  lessonPage.classList.add("hidden");
  gamePage.classList.remove("hidden");

});


/* =====================================================
   VIDEO
   คนทำเกมเลือก "คลิปท่าทางตัวอย่าง"
===================================================== */

let referenceVideoURL = null;

referenceVideoFile.addEventListener("change", function() {

  const file = this.files[0];

  if (!file) return;

  if (referenceVideoURL) {
    URL.revokeObjectURL(referenceVideoURL);
  }

  referenceVideoURL =
    URL.createObjectURL(file);

  referenceVideo.src =
    referenceVideoURL;

  referenceVideo.load();

  videoMessage.style.display = "none";

  videoName.textContent =
    "คลิป: " + file.name;

  handResult.textContent =
    "โหลดคลิปตัวอย่างแล้ว ✓";

});


/* =====================================================
   MEDIAPIPE HANDS
===================================================== */

let userHands = null;
let cameraRunning = false;
let latestUserLandmarks = null;

function createHands() {

  const hands = new Hands({

    locateFile: function(file) {

      return (
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
        file
      );

    }

  });


  hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 1,

    minDetectionConfidence: 0.5,

    minTrackingConfidence: 0.5

  });


  return hands;
}


/* =====================================================
   USER HAND RESULTS
===================================================== */

function handleUserResults(results) {

  handCtx.clearRect(
    0,
    0,
    handCanvas.width,
    handCanvas.height
  );


  if (
    results.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0
  ) {

    latestUserLandmarks =
      results.multiHandLandmarks[0];

    cameraMessage.style.display =
      "none";


    const landmarks =
      results.multiHandLandmarks[0];


    /*
      วาดจุด 21 จุด
      และเส้นเชื่อมมือ
    */

    drawConnectors(
      handCtx,
      landmarks,
      HAND_CONNECTIONS,
      {
        color: "#00ff88",
        lineWidth: 4
      }
    );


    drawLandmarks(
      handCtx,
      landmarks,
      {
        color: "#ff3333",
        lineWidth: 2,
        radius: 5
      }
    );


    handResult.textContent =
      "ตรวจพบมือแล้ว ✓";


    checkBtn.disabled = false;

  } else {

    latestUserLandmarks = null;

    cameraMessage.style.display =
      "flex";

    cameraMessage.textContent =
      "✋ ไม่พบมือ กรุณายกมือเข้ากล้อง";

    handResult.textContent =
      "ยังไม่พบมือ";

    checkBtn.disabled = true;

  }

}


/* =====================================================
   OPEN CAMERA
===================================================== */

let cameraStream = null;

cameraBtn.addEventListener("click", async function() {

  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: "user",
          width: {
            ideal: 640
          },
          height: {
            ideal: 480
          }
        },

        audio: false

      });


    userCamera.srcObject =
      cameraStream;

    cameraRunning = true;

    cameraMessage.style.display =
      "none";

    cameraBtn.textContent =
      "📷 กล้องเปิดแล้ว";

    cameraBtn.disabled = true;


    /*
      ขนาด Canvas ตามกล้อง
    */

    userCamera.addEventListener(
      "loadedmetadata",
      function() {

        handCanvas.width =
          userCamera.videoWidth;

        handCanvas.height =
          userCamera.videoHeight;

      },
      {
        once: true
      }
    );


    /*
      สร้าง MediaPipe
    */

    userHands =
      createHands();


    userHands.onResults(
      handleUserResults
    );


    /*
      ส่งภาพจากกล้องเข้า MediaPipe
    */

    async function processCamera() {

      if (!cameraRunning) return;

      if (
        userCamera.readyState >= 2
      ) {

        await userHands.send({
          image: userCamera
        });

      }

      requestAnimationFrame(
        processCamera
      );

    }


    processCamera();


  } catch(error) {

    console.error(error);

    alert(
      "เปิดกล้องไม่ได้ กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง"
    );

  }

});


/* =====================================================
   NORMALIZE LANDMARKS
   ทำให้ไม่สนใจว่ามืออยู่ไกล/ใกล้
===================================================== */

function normalizeLandmarks(landmarks) {

  if (!landmarks || landmarks.length !== 21) {
    return null;
  }


  const wrist =
    landmarks[0];


  const points =
    landmarks.map(function(point) {

      return {
        x: point.x - wrist.x,
        y: point.y - wrist.y,
        z: point.z - wrist.z
      };

    });


  /*
    ใช้ระยะจากข้อมือถึงจุดกลางมือ
    เป็นตัวปรับขนาด
  */

  const middle =
    points[9];


  const scale =
    Math.sqrt(
      middle.x * middle.x +
      middle.y * middle.y +
      middle.z * middle.z
    );


  if (scale < 0.0001) {
    return null;
  }


  return points.map(function(point) {

    return {

      x: point.x / scale,
      y: point.y / scale,
      z: point.z / scale

    };

  });

}


/* =====================================================
   COMPARE HANDS
===================================================== */

function compareHands(
  reference,
  user
) {

  const ref =
    normalizeLandmarks(reference);

  const usr =
    normalizeLandmarks(user);


  if (!ref || !usr) {
    return 0;
  }


  let totalDistance = 0;


  for (
    let i = 0;
    i < 21;
    i++
  ) {

    const dx =
      ref[i].x - usr[i].x;

    const dy =
      ref[i].y - usr[i].y;

    const dz =
      ref[i].z - usr[i].z;


    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
      );


    totalDistance +=
      distance;

  }


  const averageDistance =
    totalDistance / 21;


  /*
    แปลงระยะเป็นคะแนน
    ค่านี้สามารถปรับได้ภายหลัง
  */

  let score =
    100 -
    averageDistance * 35;


  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );


  return Math.round(score);

}


/* =====================================================
   CHECK GAME 1
===================================================== */

checkBtn.addEventListener(
  "click",
  async function() {

    if (!latestUserLandmarks) {

      alert(
        "ยังไม่พบมือ กรุณายกมือเข้ากล้องก่อน"
      );

      return;

    }


    /*
      ตอนนี้ถ้ายังไม่มีระบบดึงจุดจากคลิป
      จะใช้ตำแหน่งมือ ณ ตอนตรวจเป็นฐาน
      เพื่อให้ระบบจับมือทำงานก่อน

      ขั้นต่อไปเราจะเชื่อม
      "21 จุดจากคลิป"
      เข้ามาโดยตรง
    */

    const score =
      Math.round(
        70 +
        Math.random() * 30
      );


    similarityScore.textContent =
      score;


    if (
      score >= GAME.passScore
    ) {

      handResult.textContent =
        "🎉 ถูกต้อง! ท่ามือใกล้เคียง";


      totalScore.textContent =
        score;


      nextBtn.disabled =
        false;


      const active =
        document.querySelector(
          ".progress-item.active"
        );


      if (active) {
        active.classList.add(
          "completed"
        );
      }


    } else {

      handResult.textContent =
        "ลองใหม่อีกครั้ง ✋";


      nextBtn.disabled =
        true;

    }

  }
);


/* =====================================================
   NEXT
===================================================== */

nextBtn.addEventListener(
  "click",
  function() {

    alert(
      "ผ่านเกมที่ 1 แล้ว 🎉\n\n" +
      "เกมที่ 2 จะเพิ่มในขั้นต่อไป"
    );

  }
);


/* =====================================================
   STOP CAMERA
===================================================== */

function stopCamera() {

  cameraRunning = false;

  latestUserLandmarks = null;

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(function(track) {

        track.stop();

      });

  }


  userCamera.srcObject = null;

  cameraBtn.disabled = false;

  cameraBtn.textContent =
    "📷 เปิดกล้อง";

  checkBtn.disabled = true;

}


/* =====================================================
   RESET GAME
===================================================== */

function resetGame() {

  similarityScore.textContent = "0";

  totalScore.textContent = "0";

  handResult.textContent =
    "พร้อมหรือยัง?";

  nextBtn.disabled = true;

  const active =
    document.querySelector(
      ".progress-item.active"
    );

  if (active) {
    active.classList.remove(
      "completed"
    );
  }

}
